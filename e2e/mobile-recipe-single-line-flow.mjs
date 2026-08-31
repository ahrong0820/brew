import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

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
    if (message.type() === "error") browserMessages.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserMessages.push(`pageerror: ${error.stack || error}`));

  try {
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });

    const firstRow = page.locator('[data-recipe-row="true"]').first();
    await firstRow.waitFor({ state: "visible" });

    const layout = await firstRow.evaluate((element) => {
      const profile = element.querySelector('[data-recipe-profile="true"]');
      const metrics = element.querySelector('[data-recipe-metrics="true"]');
      const tags = element.querySelector('[data-recipe-tags="true"]');
      const name = element.querySelector('[data-recipe-name="true"]');
      const meta = element.querySelector('[data-recipe-meta="true"]');
      const handle = element.querySelector('[data-recipe-drag-handle="true"]');

      if (
        !(profile instanceof HTMLElement) ||
        !(metrics instanceof HTMLElement) ||
        !(tags instanceof HTMLElement) ||
        !(name instanceof HTMLElement) ||
        !(meta instanceof HTMLElement) ||
        !(handle instanceof HTMLElement)
      ) {
        return null;
      }

      const rowRect = element.getBoundingClientRect();
      const metaRect = meta.getBoundingClientRect();
      const handleRect = handle.getBoundingClientRect();
      const nameStyle = getComputedStyle(name);

      return {
        rowHeight: rowRect.height,
        profileDisplay: getComputedStyle(profile).display,
        metricsDisplay: getComputedStyle(metrics).display,
        tagsDisplay: getComputedStyle(tags).display,
        nameWhiteSpace: nameStyle.whiteSpace,
        nameOverflow: nameStyle.overflow,
        nameTextOverflow: nameStyle.textOverflow,
        overlap: !(
          metaRect.right <= handleRect.left ||
          handleRect.right <= metaRect.left ||
          metaRect.bottom <= handleRect.top ||
          handleRect.bottom <= metaRect.top
        ),
      };
    });

    assert.ok(layout, "mobile recipe row layout hooks must exist");
    assert.equal(layout.profileDisplay, "none", "mobile recipe profile must be hidden");
    assert.equal(layout.metricsDisplay, "none", "mobile recipe metrics must be hidden");
    assert.equal(layout.tagsDisplay, "none", "mobile recipe tags must be hidden");
    assert.equal(layout.nameWhiteSpace, "nowrap", "mobile recipe name must remain on one line");
    assert.equal(layout.nameOverflow, "hidden", "mobile recipe name must clip overflow");
    assert.equal(layout.nameTextOverflow, "ellipsis", "mobile recipe name must use ellipsis");
    assert.ok(layout.rowHeight <= 72, `mobile recipe row must stay compact, got ${layout.rowHeight}px`);
    assert.equal(layout.overlap, false, "mobile recipe metadata must not overlap drag handle");
    assert.deepEqual(browserMessages, [], browserMessages.join("\n"));

    console.log("E2E PASS: mobile recipe catalog stays single-line and compact");
  } catch (error) {
    await page.screenshot({
      path: path.join(resultsDir, "mobile-recipe-single-line-e2e-failure.png"),
      fullPage: true,
    });
    await fs.writeFile(
      path.join(resultsDir, "mobile-recipe-single-line-e2e-failure.txt"),
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
