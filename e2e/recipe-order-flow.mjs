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

async function dragHandleToTarget(page, dragHandle, targetItem, holdMs = 0) {
  const handleBox = await dragHandle.boundingBox();
  const targetBox = await targetItem.boundingBox();

  assert.ok(handleBox && targetBox, "drag handle and target must have bounding boxes");
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  if (holdMs > 0) {
    await page.waitForTimeout(holdMs);
  }
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 8 },
  );
  await page.mouse.up();
}

async function assertCatalogControlsDoNotOverlap(page, recipeId, viewportLabel) {
  const row = page.locator(
    `[data-recipe-row="true"][data-recipe-id="${recipeId}"]`,
  );
  await row.waitFor({ state: "visible" });

  const layout = await row.evaluate((element) => {
    const meta = element.querySelector('[data-recipe-meta="true"]');
    const handle = element.querySelector('[data-recipe-drag-handle="true"]');
    if (!(meta instanceof HTMLElement) || !(handle instanceof HTMLElement)) {
      return null;
    }

    const metaRect = meta.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    return {
      meta: {
        left: metaRect.left,
        right: metaRect.right,
        top: metaRect.top,
        bottom: metaRect.bottom,
      },
      handle: {
        left: handleRect.left,
        right: handleRect.right,
        top: handleRect.top,
        bottom: handleRect.bottom,
        width: handleRect.width,
        height: handleRect.height,
      },
    };
  });

  assert.ok(layout, `${viewportLabel}: recipe meta and drag handle must exist`);
  const overlaps = !(
    layout.meta.right <= layout.handle.left ||
    layout.handle.right <= layout.meta.left ||
    layout.meta.bottom <= layout.handle.top ||
    layout.handle.bottom <= layout.meta.top
  );
  assert.equal(
    overlaps,
    false,
    `${viewportLabel}: favorite/time metadata must not overlap the drag handle`,
  );
  assert.ok(
    layout.handle.width <= 32.5 && layout.handle.height <= 32.5,
    `${viewportLabel}: catalog drag handle must remain compact`,
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

    const catalogDragHandle = page.getByRole("button", {
      name: `${secondRecipe.name} 순서 드래그`,
      exact: true,
    });
    const catalogTarget = page.locator(
      `[data-recipe-row="true"][data-recipe-id="${firstRecipe.id}"]`,
    );
    await dragHandleToTarget(page, catalogDragHandle, catalogTarget);

    await page.waitForFunction(
      ({ firstId }) =>
        document.querySelector('[data-recipe-list="true"] [data-recipe-row="true"]')
          ?.getAttribute("data-recipe-id") === firstId,
      { firstId: firstRecipe.id },
    );

    const catalogReorderedIds = await recipeRowIds(page);
    assert.deepEqual(
      catalogReorderedIds.slice(0, 2),
      [firstRecipe.id, secondRecipe.id],
      "dragging the main catalog handle must reorder recipe cards immediately",
    );

    const storedAfterCatalogDrag = await page.evaluate(
      (storageKey) => JSON.parse(localStorage.getItem(storageKey) || "[]"),
      recipeOrderStorageKey,
    );
    assert.deepEqual(
      storedAfterCatalogDrag.slice(0, 2),
      [firstRecipe.id, secondRecipe.id],
      "main catalog drag must persist through the shared recipe order store",
    );

    await page.getByRole("button", { name: "레시피 순서", exact: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "레시피 표시 순서 편집" });
    await dialog.waitFor({ state: "visible" });

    const drawerIds = await dialog.locator('[data-recipe-order-item="true"]').evaluateAll(
      (rows) => rows.map((row) => row.dataset.recipeOrderId).filter(Boolean),
    );
    assert.deepEqual(
      drawerIds.slice(0, 2),
      [firstRecipe.id, secondRecipe.id],
      "drawer must reflect order changes made directly in the main catalog",
    );

    const drawerDragHandle = dialog.getByRole("button", {
      name: `${firstRecipe.name} 길게 눌러 순서 이동`,
      exact: true,
    });
    const drawerTarget = dialog.locator(
      `[data-recipe-order-id="${secondRecipe.id}"]`,
    );
    await dragHandleToTarget(page, drawerDragHandle, drawerTarget, 280);

    await page.waitForFunction(
      ({ secondId }) =>
        document.querySelector('[data-recipe-list="true"] [data-recipe-row="true"]')
          ?.getAttribute("data-recipe-id") === secondId,
      { secondId: secondRecipe.id },
    );

    const reorderedIds = await recipeRowIds(page);
    assert.deepEqual(
      reorderedIds.slice(0, 2),
      [secondRecipe.id, firstRecipe.id],
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

    await assertCatalogControlsDoNotOverlap(
      page,
      reorderedIds[0],
      "desktop favorite layout",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await assertCatalogControlsDoNotOverlap(
      page,
      reorderedIds[0],
      "mobile favorite layout",
    );
    await page.setViewportSize({ width: 1280, height: 900 });

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
      "E2E PASS: main catalog drag, compact favorite layout, drawer drag, filters, and reload persistence",
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
