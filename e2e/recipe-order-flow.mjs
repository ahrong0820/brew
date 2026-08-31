import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

import { defaultRecipeCatalogEntries } from "../lib/recipes/defaultRecipeCatalog.ts";
import { recipeOrderStorageKey } from "../lib/recipes/useRecipeOrder.ts";
import { startStaticExportServer } from "./helpers/static-export-server.mjs";

const outDir = path.resolve("out");
const resultsDir = path.resolve("test-results");
const firstRecipe = defaultRecipeCatalogEntries[0];
const secondRecipe = defaultRecipeCatalogEntries[1];

if (!firstRecipe || !secondRecipe) {
  throw new Error("At least two default recipes are required for recipe-order E2E");
}

async function recipeRowIds(page) {
  return page.locator('[data-recipe-list="true"] > [data-recipe-row="true"]').evaluateAll(
    (rows) => rows.map((row) => row.dataset.recipeId).filter(Boolean),
  );
}

async function run() {
  if (!existsSync(path.join(outDir, "index.html"))) {
    throw new Error("Static export missing");
  }

  await fs.mkdir(resultsDir, { recursive: true });
  const server = await startStaticExportServer(outDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
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
    await page.evaluate(
      ({ storageKey, firstName, secondName }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(storageKey, JSON.stringify([secondName, firstName]));
      },
      {
        storageKey: recipeOrderStorageKey,
        firstName: firstRecipe.name,
        secondName: secondRecipe.name,
      },
    );
    await page.reload({ waitUntil: "networkidle" });

    const recipeRows = page.locator('[data-recipe-row="true"]');
    await recipeRows.first().waitFor({ state: "visible" });

    const migratedOrder = await recipeRowIds(page);
    assert.deepEqual(
      migratedOrder.slice(0, 2),
      [secondRecipe.id, firstRecipe.id],
      "legacy name order must migrate before React renders the catalog order",
    );

    const storedAfterMigration = await page.evaluate(
      (storageKey) => JSON.parse(localStorage.getItem(storageKey) || "[]"),
      recipeOrderStorageKey,
    );
    assert.deepEqual(
      storedAfterMigration.slice(0, 2),
      [secondRecipe.id, firstRecipe.id],
      "migrated recipe order must be persisted as recipe ids",
    );

    await page.getByRole("button", { name: "레시피 순서", exact: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "레시피 표시 순서 편집" });
    await dialog.waitFor({ state: "visible" });

    const dragHandle = dialog.getByRole("button", {
      name: `${secondRecipe.name} 길게 눌러 순서 이동`,
      exact: true,
    });
    const targetItem = dialog.locator(
      `[data-recipe-order-id="${firstRecipe.id}"]`,
    );
    const handleBox = await dragHandle.boundingBox();
    const targetBox = await targetItem.boundingBox();

    assert.ok(handleBox && targetBox, "drag handle and target must have bounding boxes");
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2,
    );
    await page.mouse.down();
    await page.waitForTimeout(280);
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();

    await page.waitForFunction(
      ({ firstId }) =>
        document.querySelector('[data-recipe-list="true"] [data-recipe-row="true"]')
          ?.getAttribute("data-recipe-id") === firstId,
      { firstId: firstRecipe.id },
    );

    const reorderedIds = await recipeRowIds(page);
    assert.deepEqual(
      reorderedIds.slice(0, 2),
      [firstRecipe.id, secondRecipe.id],
      "dragging in the drawer must reorder the React-rendered recipe cards",
    );

    await dialog.getByRole("button", { name: "완료", exact: true }).click();

    const searchInput = page.getByRole("textbox", { name: "레시피 검색" });
    await searchInput.fill("V60");
    const searchIds = await recipeRowIds(page);
    const searchIdSet = new Set(searchIds);
    assert.deepEqual(
      searchIds,
      reorderedIds.filter((id) => searchIdSet.has(id)),
      "search results must preserve the global recipe order",
    );
    await searchInput.fill("");

    const timerPanel = page.locator('[data-timer-panel="true"]');
    await timerPanel.waitFor({ state: "visible" });
    for (const recipeId of reorderedIds.slice(0, 2)) {
      await page.locator(`[data-recipe-row="true"][data-recipe-id="${recipeId}"]`).click();
      await timerPanel.getByRole("button", { name: "즐겨찾기", exact: true }).click();
    }
    await page.getByRole("button", { name: "즐겨찾기", exact: true }).first().click();
    const favoriteIds = await recipeRowIds(page);
    assert.deepEqual(
      favoriteIds,
      reorderedIds.slice(0, 2),
      "favorites filter must preserve the global recipe order",
    );

    await page.reload({ waitUntil: "networkidle" });
    await page.locator('[data-recipe-row="true"]').first().waitFor({ state: "visible" });
    const restoredIds = await recipeRowIds(page);
    assert.deepEqual(
      restoredIds.slice(0, 2),
      reorderedIds.slice(0, 2),
      "recipe order must survive a reload",
    );

    const storedAfterDrag = await page.evaluate(
      (storageKey) => JSON.parse(localStorage.getItem(storageKey) || "[]"),
      recipeOrderStorageKey,
    );
    assert.deepEqual(storedAfterDrag, restoredIds, "stored ids must match the rendered React order");
    assert.deepEqual(browserMessages, [], browserMessages.join("\n"));

    console.log(
      "E2E PASS: recipe order name migration, long-press drag, filters, and reload persistence",
    );
  } catch (error) {
    await page.screenshot({
      path: path.join(resultsDir, "recipe-order-e2e-failure.png"),
      fullPage: true,
    });
    await fs.writeFile(
      path.join(resultsDir, "recipe-order-e2e-failure.txt"),
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
