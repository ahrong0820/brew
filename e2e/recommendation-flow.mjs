import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { runRecommendationJourney } from "./helpers/recommendation-journey.mjs";
import { startStaticExportServer } from "./helpers/static-export-server.mjs";

const outDir = path.resolve("out");
const resultsDir = path.resolve("test-results");

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
    if (message.type() === "error") {
      browserMessages.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) =>
    browserMessages.push(`pageerror: ${error.stack || error}`),
  );

  try {
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });
    await runRecommendationJourney(page);
    assert.deepEqual(browserMessages, [], browserMessages.join("\n"));
    console.log(
      "E2E PASS: bean persistence, Clever selection, feedback personalization, and version restore",
    );
  } catch (error) {
    await page.screenshot({
      path: path.join(resultsDir, "recommendation-e2e-failure.png"),
      fullPage: true,
    });
    await fs.writeFile(
      path.join(resultsDir, "recommendation-e2e-failure.txt"),
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
