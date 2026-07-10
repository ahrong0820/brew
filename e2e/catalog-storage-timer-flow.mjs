import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { startStaticExportServer } from "./helpers/static-export-server.mjs";

const outDir = path.resolve("out");
const resultsDir = path.resolve("test-results");
const expectedRecipeNames = [
  "테츠 카스야 4:6 기본형",
  "테츠 카스야 THE NEO BREW 2026",
  "안스타 6888",
  "정인성 국룰 Ver 2.0 HOT",
  "정인성 484 15g (2026)",
  "용챔 라이트로스트 15g",
  "테츠 카스야 악마의 레시피",
  "제임스 호프만 클레버",
  "정인성 클레버 1:11",
];
const removedRecipeNames = [
  "시그니쳐 로스터스 콘 필터",
  "딥블루레이크 V60 HOT",
  "정인성 4666 오리지널",
  "정인성 클레버 1:12",
];

function validCustomRecipe() {
  return {
    id: "custom-7",
    name: "E2E 저장 레시피",
    origin: "나만의 레시피",
    method: "V60",
    profile: "브라우저 복원 확인",
    tags: ["나만의 레시피", "V60"],
    dose: 20,
    water: 300,
    ratio: "1:15",
    temp: "92℃",
    grind: "중간 분쇄",
    totalTime: 60,
    notes: ["E2E"],
    steps: [
      {
        label: "전체 추출",
        start: 0,
        end: 60,
        targetWater: 300,
        cue: "60초 동안 추출",
      },
    ],
  };
}

async function run() {
  if (!existsSync(path.join(outDir, "index.html"))) {
    throw new Error("Static export missing");
  }

  await fs.mkdir(resultsDir, { recursive: true });
  const server = await startStaticExportServer(outDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ko-KR",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const browserMessages = [];

  page.on("console", (message) => {
    if (message.type() === "error") browserMessages.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserMessages.push(`pageerror: ${error.stack || error}`));

  try {
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.evaluate((customRecipe) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("coffee-recipe-favorites", "{malformed-json");
      localStorage.setItem(
        "coffee-custom-recipes",
        JSON.stringify([
          customRecipe,
          {
            id: "custom-broken",
            name: "손상 레시피",
            dose: 0,
            water: -1,
            totalTime: -20,
            tags: [],
            notes: [],
            steps: [{}],
          },
        ]),
      );
      localStorage.setItem(
        "brew.beanBrewProfiles.v1",
        JSON.stringify({
          version: 1,
          updatedAt: "2026-07-10T00:00:00.000Z",
          items: [
            { id: "profile-alias", sourceRecipeId: "anstar-multiserve-20g-2024" },
            { id: "profile-stale", sourceRecipeId: "jis-clever-112" },
          ],
        }),
      );
    }, validCustomRecipe());
    await page.reload({ waitUntil: "networkidle" });

    const recipeRows = page.locator('[data-recipe-row="true"]');
    await recipeRows.first().waitFor({ state: "visible" });
    assert.equal(await recipeRows.count(), 10, "9 defaults plus one valid custom recipe must render");

    for (const recipeName of expectedRecipeNames) {
      await page.getByRole("button", { name: new RegExp(recipeName) }).first().waitFor();
    }
    for (const recipeName of removedRecipeNames) {
      assert.equal(await page.getByText(recipeName, { exact: false }).count(), 0, `${recipeName} must be absent`);
    }
    await page.getByText("E2E 저장 레시피", { exact: true }).first().waitFor();
    assert.equal(await page.getByText("손상 레시피", { exact: true }).count(), 0);

    const storageState = await page.evaluate(() => ({
      favorites: localStorage.getItem("coffee-recipe-favorites"),
      custom: JSON.parse(localStorage.getItem("coffee-custom-recipes") || "[]"),
      quarantine: JSON.parse(
        localStorage.getItem("coffee-custom-recipes-quarantine.v1") || "[]",
      ),
      profiles: JSON.parse(localStorage.getItem("brew.beanBrewProfiles.v1") || "null"),
    }));
    assert.deepEqual(JSON.parse(storageState.favorites || "[]"), []);
    assert.deepEqual(storageState.custom.map((recipe) => recipe.id), ["custom-7"]);
    assert.ok(storageState.quarantine.length >= 1, "invalid custom recipe must be quarantined");
    assert.equal(storageState.profiles.items[0].sourceRecipeId, "anstar-6888");
    assert.equal("sourceRecipeId" in storageState.profiles.items[1], false);

    const timerPanel = page.locator('[data-timer-panel="true"]');
    await timerPanel.waitFor({ state: "visible" });
    await timerPanel.getByRole("button", { name: "시작", exact: true }).click();
    await timerPanel.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "networkidle" });

    const restoredTimer = page.locator('[data-timer-panel="true"]');
    await restoredTimer.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    const elapsedText = await restoredTimer.locator("strong.font-mono").first().textContent();
    assert.notEqual(elapsedText?.trim(), "0:00", "running timer must survive a reload");
    await page.getByText("E2E 저장 레시피", { exact: true }).first().waitFor();

    assert.deepEqual(browserMessages, [], browserMessages.join("\n"));
    console.log(
      "E2E PASS: exact catalog, malformed storage isolation, custom quarantine, and timer reload",
    );
  } catch (error) {
    await page.screenshot({
      path: path.join(resultsDir, "catalog-storage-timer-e2e-failure.png"),
      fullPage: true,
    });
    await fs.writeFile(
      path.join(resultsDir, "catalog-storage-timer-e2e-failure.txt"),
      `${error.stack || error}\nURL: ${page.url()}\n${browserMessages.join("\n")}\n`,
    );
    throw error;
  } finally {
    await context.close();
    await browser.close();
    await server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
