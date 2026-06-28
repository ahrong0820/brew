import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("out");
const resultsDir = path.resolve("test-results");
const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

function staticFile(requestUrl) {
  const url = new URL(requestUrl, "http://127.0.0.1");
  if (!url.pathname.startsWith("/brew")) return null;
  let pathname = decodeURIComponent(url.pathname.slice(5));
  if (!pathname || pathname === "/") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";
  const file = path.resolve(outDir, `.${pathname}`);
  return file.startsWith(outDir) ? file : null;
}

async function startServer() {
  const server = createServer(async (request, response) => {
    let file = staticFile(request.url || "/");
    if (!file) return response.writeHead(404).end();
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
    } catch {
      if (!path.extname(file)) file = path.join(outDir, "index.html");
    }
    try {
      const body = await fs.readFile(file);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("E2E server port unavailable");
  return { server, url: `http://127.0.0.1:${address.port}/brew/` };
}

function field(dialog, label) {
  return dialog.locator("label").filter({ hasText: label }).first();
}

async function storage(page) {
  return page.evaluate(() => {
    const result = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) result[key] = localStorage.getItem(key);
    }
    return result;
  });
}

function items(snapshot, key) {
  const value = JSON.parse(snapshot[key] || "null");
  assert.equal(value?.version, 1, `${key} version`);
  assert.ok(Array.isArray(value.items), `${key} items`);
  return value.items;
}

async function close(page, name) {
  await page.getByRole("button", { name }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

async function run() {
  if (!existsSync(path.join(outDir, "index.html"))) throw new Error("Static export missing");
  await fs.mkdir(resultsDir, { recursive: true });
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ko-KR",
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });

    await page.getByRole("button", { name: "원두", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "내 원두" });
    await dialog.getByRole("button", { name: /원두 등록/ }).first().click();
    await field(dialog, "원두 이름").locator("input").fill("E2E 에티오피아 워시드");
    await field(dialog, "로스터").locator("input").fill("Brew Test Roaster");
    await field(dialog, "산지").locator("select").selectOption("ethiopia");
    await field(dialog, "배전도").locator("select").selectOption("light");
    await field(dialog, "가공 방식").locator("select").selectOption("washed");
    await dialog.getByRole("button", { name: "원두 저장" }).click();
    await dialog.getByText("E2E 에티오피아 워시드", { exact: true }).waitFor();
    await close(page, "내 원두 닫기");

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "원두", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "내 원두" });
    await dialog.getByText("E2E 에티오피아 워시드", { exact: true }).waitFor();
    await close(page, "내 원두 닫기");

    await page.getByRole("button", { name: "추천", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "원두 맞춤 추천" });
    await field(dialog, "원두량(g)").locator("input").fill("19");
    await field(dialog, "드리퍼").locator("select").selectOption("clever");
    await dialog.getByRole("button", { name: "추천 만들기" }).click();
    await dialog.getByRole("heading", { name: "클레버 공식 유통 레시피 18.5g" }).waitFor();
    await dialog.getByText("공식·검증", { exact: true }).waitFor();
    const recommendationText = await dialog.textContent();
    assert.match(recommendationText || "", /100℃/);
    assert.match(recommendationText || "", /2:30~2:45/);

    const overlay = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      visibleFloating: [...document.querySelectorAll("body > button.fixed.z-40")].filter(
        (button) => getComputedStyle(button).display !== "none" && getComputedStyle(button).visibility !== "hidden",
      ).length,
    }));
    assert.equal(overlay.overflow, "hidden");
    assert.equal(overlay.visibleFloating, 0);

    await field(dialog, "드리퍼").locator("select").selectOption("v60");
    await dialog.getByRole("button", { name: "추천 만들기" }).click();
    await dialog.getByRole("heading", { name: "클레버 공식 유통 레시피 18.5g" }).waitFor({ state: "hidden" });
    await field(dialog, "드리퍼").locator("select").selectOption("clever");
    await dialog.getByRole("button", { name: "추천 만들기" }).click();
    await dialog.getByRole("heading", { name: "클레버 공식 유통 레시피 18.5g" }).waitFor();
    await dialog.getByRole("button", { name: "이 레시피로 타이머 시작" }).click();

    await page.getByText("추출 타이머 측정 중", { exact: true }).waitFor();
    let snapshot = await storage(page);
    let sessions = items(snapshot, "brew.brewSessions.v1");
    let profiles = items(snapshot, "brew.beanBrewProfiles.v1");
    assert.equal(sessions.length, 1);
    assert.equal(profiles[0].sourceRecipeId, "clever-official-distributor-185");

    await page.getByRole("button", { name: "추출 완료" }).click();
    dialog = page.getByRole("dialog", { name: "추출 결과 기록" });
    await dialog.getByRole("button", { name: /적정/ }).click();
    await dialog.getByRole("button", { name: /좋음/ }).click();
    await field(dialog, "메모").locator("textarea").fill("공식 클레버 E2E 성공");
    await dialog.getByRole("button", { name: "평가 저장" }).click();
    await dialog.waitFor({ state: "hidden", timeout: 4000 });

    snapshot = await storage(page);
    sessions = items(snapshot, "brew.brewSessions.v1");
    profiles = items(snapshot, "brew.beanBrewProfiles.v1");
    assert.equal(sessions[0].status, "current-best");
    assert.equal(sessions[0].brewPaceAssessment, "in-range");
    assert.equal(profiles[0].personalRecipe?.version, 1);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: /개인 레시피 버전 열기/ }).click();
    dialog = page.getByRole("dialog", { name: "개인 레시피 버전" });
    await dialog.getByText("잠정 개인 성공", { exact: true }).waitFor();
    await dialog.getByText("v1", { exact: true }).first().waitFor();
    await close(page, "개인 레시피 버전 닫기");

    await page.getByRole("button", { name: "추천", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "원두 맞춤 추천" });
    await field(dialog, "드리퍼").locator("select").selectOption("v60");
    await dialog.getByRole("button", { name: "추천 만들기" }).click();
    await dialog.getByRole("button", { name: "이 레시피로 타이머 시작" }).click();
    await page.getByText("추출 타이머 측정 중", { exact: true }).waitFor();

    snapshot = await storage(page);
    sessions = items(snapshot, "brew.brewSessions.v1");
    profiles = items(snapshot, "brew.beanBrewProfiles.v1");
    assert.equal(sessions.length, 2);
    const clever = profiles.find((profile) => profile.brewerType === "clever");
    const v60 = profiles.find((profile) => profile.brewerType === "v60");
    assert.equal(clever?.personalRecipe?.version, 1);
    assert.ok(v60);
    assert.notEqual(clever.id, v60.id);

    await page.getByRole("button", { name: "추출 취소" }).click();
    const alert = page.getByRole("alertdialog", { name: "진행 중인 추출을 폐기할까요?" });
    await alert.getByRole("button", { name: "취소하고 폐기" }).click();
    await alert.waitFor({ state: "hidden" });
    snapshot = await storage(page);
    sessions = items(snapshot, "brew.brewSessions.v1");
    profiles = items(snapshot, "brew.beanBrewProfiles.v1");
    assert.equal(sessions.length, 1);
    assert.equal(profiles.find((profile) => profile.brewerType === "clever")?.personalRecipe?.version, 1);

    console.log("E2E PASS: mobile persistence, verified Clever, feedback, versioning, and isolation");
  } catch (error) {
    await page.screenshot({ path: path.join(resultsDir, "e2e-failure.png"), fullPage: true });
    await fs.writeFile(path.join(resultsDir, "e2e-failure.txt"), `${error.stack || error}\nURL: ${page.url()}\n`);
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
