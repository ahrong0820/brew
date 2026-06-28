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
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function staticFile(requestUrl) {
  const url = new URL(requestUrl, "http://127.0.0.1");
  if (!url.pathname.startsWith("/brew")) return null;

  let pathname = decodeURIComponent(url.pathname.slice("/brew".length));
  if (!pathname || pathname === "/") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";

  const file = path.resolve(outDir, `.${pathname}`);
  return file.startsWith(`${outDir}${path.sep}`) || file === outDir ? file : null;
}

async function startServer() {
  const server = createServer(async (request, response) => {
    let file = staticFile(request.url || "/");
    if (!file) {
      response.writeHead(404).end();
      return;
    }

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
  if (!address || typeof address === "string") {
    throw new Error("E2E server port unavailable");
  }

  return { server, url: `http://127.0.0.1:${address.port}/brew/` };
}

async function waitForCount(locator, minimum = 1) {
  await locator.first().waitFor({ state: "attached" });
  const count = await locator.count();
  assert.ok(count >= minimum, `expected at least ${minimum} elements, received ${count}`);
}

async function run() {
  if (!existsSync(path.join(outDir, "index.html"))) {
    throw new Error("Static export missing");
  }

  await fs.mkdir(resultsDir, { recursive: true });
  const { server, url } = await startServer();
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
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });

    const mobileNav = page.locator('nav[data-mobile-coffee-nav="true"]');
    await mobileNav.waitFor({ state: "visible" });
    for (const label of ["추천", "원두", "기록", "도구"]) {
      await mobileNav.getByRole("button", { name: label, exact: true }).waitFor();
    }

    await mobileNav.getByRole("button", { name: "도구", exact: true }).click();
    const toolsDialog = page.getByRole("dialog", { name: "도구" });
    await toolsDialog.waitFor({ state: "visible" });
    for (const label of ["분쇄도 변환", "세부 산지", "개인 레시피 버전", "근거 현황"]) {
      await toolsDialog.getByText(label, { exact: true }).waitFor();
    }
    await toolsDialog.getByRole("button", { name: "도구 메뉴 닫기" }).click();
    await toolsDialog.waitFor({ state: "hidden" });

    const timerPanel = page.locator('[data-timer-panel="true"]');
    await timerPanel.waitFor({ state: "attached" });
    const doseInput = timerPanel.locator('input[data-timer-dose-input="true"]');
    await doseInput.waitFor({ state: "visible" });

    await doseInput.fill("");
    await page.waitForTimeout(250);
    assert.equal(await doseInput.inputValue(), "", "blank dose must remain editable");

    await doseInput.fill("22");
    await page.waitForTimeout(150);
    assert.equal(await doseInput.inputValue(), "22", "valid dose must not clamp unexpectedly");
    await doseInput.press("Tab");
    assert.equal(await doseInput.inputValue(), "22", "valid dose must commit on blur");

    await doseInput.focus();
    await doseInput.fill("4");
    await page.waitForTimeout(250);
    assert.equal(await doseInput.inputValue(), "4", "partial out-of-range input must remain editable");
    await doseInput.press("Tab");
    await page.waitForTimeout(100);
    assert.equal(await doseInput.inputValue(), "22", "invalid dose must restore the last valid value");

    const recipeRows = page.locator('[data-recipe-row="true"]');
    await waitForCount(recipeRows, 2);
    await recipeRows.nth(1).click();
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('[data-recipe-row="true"]');
      return rows[1]?.getAttribute("aria-current") === "true";
    });

    const startButton = timerPanel.getByRole("button", { name: "시작", exact: true });
    await startButton.waitFor({ state: "visible" });
    await startButton.click();
    await timerPanel.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    await mobileNav.waitFor({ state: "detached" });

    await timerPanel.getByRole("button", { name: "일시정지", exact: true }).click();
    await timerPanel.getByRole("button", { name: "시작", exact: true }).waitFor();
    assert.equal(await mobileNav.count(), 0, "mobile navigation must stay hidden while paused");

    assert.deepEqual(browserMessages, [], browserMessages.join("\n"));
    console.log("E2E PASS: mobile tools, dose editing, recipe selection, and timer navigation");
  } catch (error) {
    await page.screenshot({ path: path.join(resultsDir, "e2e-failure.png"), fullPage: true });
    await fs.writeFile(
      path.join(resultsDir, "e2e-failure.txt"),
      `${error.stack || error}\nURL: ${page.url()}\n${browserMessages.join("\n")}\n`,
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
