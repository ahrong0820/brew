import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { defaultRecipes } from "../data/defaultRecipes.ts";
import {
  defaultRecipeCatalogEntries,
  removedDefaultRecipeIds,
} from "../lib/recipes/defaultRecipeCatalog.ts";

test("default recipe UI catalog has one canonical nine-recipe source", () => {
  assert.deepEqual(
    defaultRecipes.map(({ id, name }) => ({ id, name })),
    defaultRecipeCatalogEntries.map((entry) => ({ ...entry })),
  );
  assert.equal(defaultRecipes.length, 9);
  assert.equal(
    defaultRecipes.some((recipe) => removedDefaultRecipeIds.includes(recipe.id)),
    false,
  );
});

test("main page imports shared types and contains no embedded legacy catalog", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /from "@\/data\/defaultRecipes"/);
  assert.match(page, /from "@\/lib\/types\/defaultRecipe"/);
  assert.doesNotMatch(page, /const legacyRecipes/);
  assert.doesNotMatch(page, /type Recipe =/);
  assert.doesNotMatch(page, /정인성 4666 오리지널/);
});
