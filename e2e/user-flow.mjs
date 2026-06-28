import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as fsp from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const outputDirectory = path.resolve(process.cwd(), "out");
const artifactDirectory = path.resolve(process.cwd(), "test-results");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function resolveStaticPath(requestUrl) {
  const parsed = new URL(requestUrl, "http://127.0.0.1");
  let pathname = decodeURIComponent(parsed.pathname);
  if (!pathname.startsWith("/brew")) return null;

  pathname = pathname.slice("/brew".length);
  if (pathname === "" || pathname === "/") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";

  const resolved = path.resolve(outputDirectory, `.${pathname}`);
  return resolved.startsWith(outputDirectory) ? resolved : null;
}

function startStaticServer() {
  const server = createServer(async (request, response) => {
    const requestedPath = resolveStaticPath(request.url || "/");
    if (!requestedPath) {
      response.writeHead(404).end("Not found");
      return;
    }

    let filePath = requestedPath;
    try {
      const stat = await fsp.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
    } catch {
      if (!path.extname(filePath)) filePath = path.join(outputDirectory, "index.html");
    }

    try {
      const body = await fsp.readFile(filePath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Static E2E server did not expose a TCP port."));
        return;
      }
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}/brew/`,
      });
    });
  });
}

async function closeDialog(page, accessibleName) {
  await page.getByRole("button", { name: accessibleName }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

async function selectField(dialog, labelText, value) {
  const label = dialog.locator("label").filter({ hasText: labelText }).first();
  await label.locator("select").selectOption(value);
}

async function fillField(dialog, labelText, value) {
  const label = dialog.locator("label").filter({ hasText: labelText }).first();
  await label.locator("input, textarea").fill(value);
}

function readVersionedItems(storage, key) {
  const parsed = JSON.parse(storage[key] || "null");
  assert.equal(parsed?.version, 1, `${key} schema version`);
  assert.ok(Array.isArray(parsed.items), `${key} items`);
  return parsed.items;
}

async function readLocalStorage(page) {
  return page.evaluate(() => {
    const values = {};
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) values[key] = window.localStorage.getItem(key);
    }
    return values;
  });
}

async function run() {
  if (!existsSync(path.join(outputDirectory, "index.html"))) {
    throw new Error("Static export is missing. Run the GitHub Pages build before E2E tests.");
  }

  await fsp.mkdir(artifactDirectory, { recursive: true });
  const { server, baseUrl } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ko-KR",
  });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /핸드드립.*레시피 노트/ }).waitFor();

    await page.getByRole("button", { name: "원두", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "내 원두" });
    await dialog.getByRole("button", { name: /원두 등록/ }).first().click();
    await fillField(dialog, "원두 이름", "E2E 에티오피아 워시드");
    await fillField(dialog, "로스터", "Brew Test Roaster");
    await selectField(dialog, "산지", "ethiopia");
    await selectField(dialog, "배전도", "light");
    await selectField(dialog, "가공 방식", "washed");
    await dialog.getByText("상세 기록", { exact: true }).click();
    await fillField(dialog, "품종", "Heirloom");
    await fillField(dialog, "향미 노트", "카라멜, 초콜릿, 자스민");
    await dialog.getByRole("button", { name: "원두 저장" }).click();
    await dialog.getByText("E2E 에티오피아 워시드", { exact: true }).waitFor();
    await closeDialog(page, "내 원두 닫기");

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "원두", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "내 원두" });
    await dialog.getByText("E2E 에티오피아 워시드", { exact: true }).waitFor();
    await closeDialog(page, "내 원두 닫기");

    await page.getByRole("button", { name: "추천", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "원두 맞춤 추천" });
    await fillField(dialog, "원두량(g)", "19");
    await selectField(dialog, "드리퍼", "clever");
    await dialog.getByRole("button", { name: /밸런스/ }).click();
    await dialog.getByRole("button", { name: "추천 만들기" }).click();

    await dialog
      .getByRole("heading", { name: "클레버 공식 유통 레시피 18.5g" })
      .waitFor();
    await dialog.getByText("공식·검증", { exact: true }).waitFor();
    await dialog.getByText("100℃", { exact: true }).first().waitFor();
    await dialog.getByText("2:30~2:45", { exact: true }).waitFor();

    const overlayState = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      hiddenFloatingControls: [...document.querySelectorAll("body > button.fixed.z-40")].filter(
        (element) => getComputedStyle(element).visibility === "hidden",
      ).length,
    }));
    assert.equal(overlayState.overflow, "hidden");
    assert.ok(overlayState.hiddenFloatingControls > 0);

    await selectField(dialog, "드리퍼", "v60");
    await dialog.getByRole("button", { name: "추천 만들기" }).click();
    await dialog
      .getByRole("heading", { name: "클레버 공식 유통 레시피 18.5g" })
      .waitFor({ state: "hidden" });

    await selectField(dialog, "드리퍼", "clever");
    await dialog.getByRole("button", { name: "추천 만들기" }).click();
    await dialog
      .getByRole("heading", { name: "클레버 공식 유통 레시피 18.5g" })
      .waitFor();
    await dialog.getByRole("button", { name: "이 레시피로 타이머 시작" }).click();

    await page.getByText("추출 타이머 측정 중", { exact: true }).waitFor();
    let stored = await readLocalStorage(page);
    let sessions = readVersionedItems(stored, "brew.brewSessions.v1");
    let profiles = readVersionedItems(stored, "brew.beanBrewProfiles.v1");
    assert.equal(sessions.length, 1);
    assert.equal(profiles.length, 1);
    assert.equal(sessions[0].recipeSnapshot.brewerType, "clever");
    assert.equal(profiles[0].sourceRecipeId, "clever-official-distributor-185");

    await page.getByRole("button", { name: "추출 완료" }).click();
    dialog = page.getByRole("dialog", { name: "추출 결과 기록" });
    await dialog.getByRole("button", { name: /적정/ }).click();
    await dialog.getByRole("button", { name: /좋음/ }).click();
    await fillField(dialog, "메모", "공식 클레버 레시피 E2E 성공");
    await dialog.getByRole("button", { name: "평가 저장" }).click();
    await dialog.getByText("추출 속도와 맛 평가를 저장했습니다.").waitFor();
    await dialog.waitFor({ state: "hidden", timeout: 4000 });

    stored = await readLocalStorage(page);
    sessions = readVersionedItems(stored, "brew.brewSessions.v1");
    profiles = readVersionedItems(stored, "brew.beanBrewProfiles.v1");
    assert.equal(sessions[0].brewPaceAssessment, "in-range");
    assert.equal(sessions[0].tastingResult, "good");
    assert.equal(sessions[0].status, "current-best");
    assert.equal(profiles[0].personalRecipe?.version, 1);
    assert.equal(profiles[0].personalRecipe?.status, "provisional");

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: /개인 레시피 버전 열기/ }).click();
    dialog = page.getByRole("dialog", { name: "개인 레시피 버전" });
    await dialog.getByText("잠정 개인 성공", { exact: true }).waitFor();
    await dialog.getByText("v1", { exact: true }).first().waitFor();
    await closeDialog(page, "개인 레시피 버전 닫기");

    await page.getByRole("button", { name: "추천", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "원두 맞춤 추천" });
    await selectField(dialog, "드리퍼", "v60");
    await dialog.getByRole("button", { name: "추천 만들기" }).click();
    await dialog.getByRole("button", { name: "이 레시피로 타이머 시작" }).click();
    await page.getByText("추출 타이머 측정 중", { exact: true }).waitFor();

    stored = await readLocalStorage(page);
    sessions = readVersionedItems(stored, "brew.brewSessions.v1");
    profiles = readVersionedItems(stored, "brew.beanBrewProfiles.v1");
    assert.equal(sessions.length, 2);
    assert.equal(profiles.length, 2);
    const cleverProfile = profiles.find((profile) => profile.brewerType === "clever");
    const v60Profile = profiles.find((profile) => profile.brewerType === "v60");
    assert.equal(cleverProfile?.personalRecipe?.version, 1);
    assert.ok(v60Profile);
    assert.notEqual(cleverProfile.id, v60Profile.id);

    await page.getByRole("button", { name: "추출 취소" }).click();
    const alertDialog = page.getByRole("alertdialog", {
      name: "진행 중인 추출을 폐기할까요?",
    });
    await alertDialog.getByRole("button", { name: "취소하고 폐기" }).click();
    await alertDialog.waitFor({ state: "hidden" });

    stored = await readLocalStorage(page);
    sessions = readVersionedItems(stored, "brew.brewSessions.v1");
    profiles = readVersionedItems(stored, "brew.beanBrewProfiles.v1");
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].recipeSnapshot.brewerType, "clever");
    assert.equal(
      profiles.find((profile) => profile.brewerType === "clever")?.personalRecipe?.version,
      1,
    );

    console.log(
      "E2E PASS: mobile registration, persistence, verified Clever, feedback, recipe version, and profile isolation",
    );
  } catch (error) {
    await page.screenshot({
      path: path.join(artifactDirectory, "e2e-failure.png"),
      fullPage: true,
    });
    await fsp.writeFile(
      path.join(artifactDirectory, "e2e-failure.txt"),
      `${error.stack || error}\nURL: ${page.url()}\n`,
      "utf8",
    );
    throw error;
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
