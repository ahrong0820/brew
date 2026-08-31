import assert from "node:assert/strict";

import {
  defaultRecipeCatalogEntries,
  removedDefaultRecipeNames,
} from "../lib/recipes/defaultRecipeCatalog.ts";
import { resetBrowserStorage, runStaticE2E } from "./helpers/static-e2e-harness.mjs";

const expectedRecipeNames = defaultRecipeCatalogEntries.map(({ name }) => name);

runStaticE2E("catalog", async ({ page }) => {
  await resetBrowserStorage(page);

  const recipeRows = page.locator('[data-recipe-row="true"]');
  await recipeRows.first().waitFor({ state: "visible" });
  assert.equal(
    await recipeRows.count(),
    expectedRecipeNames.length,
    "catalog must render exactly the active registry defaults",
  );

  for (const recipeName of expectedRecipeNames) {
    await page
      .getByRole("button", { name: recipeName, exact: false })
      .first()
      .waitFor();
  }

  for (const recipeName of removedDefaultRecipeNames) {
    assert.equal(
      await page.getByText(recipeName, { exact: false }).count(),
      0,
      `${recipeName} must be absent`,
    );
  }

  const tetsuNeoRow = page.locator('[data-recipe-id="tetsu-neo-2026"]');
  await tetsuNeoRow.getByText("HARIO NEO", { exact: true }).waitFor();
  await tetsuNeoRow
    .getByText("테츠 카스야 NEO 10푸어 레시피", { exact: true })
    .waitFor();

  await page.getByRole("button", { name: "V60", exact: true }).click();
  await page.locator('[data-recipe-id="tetsu-46"]').waitFor();
  assert.equal(
    await page.locator('[data-recipe-id="tetsu-neo-2026"]').count(),
    0,
    "HARIO NEO 10-pour recipe must not appear in the V60 category",
  );

  await page.getByRole("button", { name: "NEO", exact: true }).click();
  await page.locator('[data-recipe-id="tetsu-neo-2026"]').waitFor();
  assert.equal(
    await recipeRows.count(),
    1,
    "NEO category must contain only the dedicated HARIO NEO recipe",
  );

  await page.getByRole("button", { name: "NEO 스위치", exact: true }).click();
  await page.locator('[data-recipe-id="yong-neo-reverse-switch-hot"]').waitFor();
  assert.equal(
    await recipeRows.count(),
    2,
    "NEO Switch category must contain HOT and ICE recipes",
  );
  await page.locator('[data-recipe-id="yong-neo-reverse-switch-ice"]').waitFor();

  await page.getByRole("button", { name: "스위치", exact: true }).click();
  await page.locator('[data-recipe-id="yong-neo-reverse-switch-hot"]').waitFor();
  await page.locator('[data-recipe-id="yong-neo-reverse-switch-ice"]').waitFor();
});
