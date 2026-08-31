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
});
