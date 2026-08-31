import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { defaultRecipes } from "../data/defaultRecipes.ts";
import {
  defaultRecipeCatalogEntries,
  defaultRecipeIdAliases,
  defaultRecipeRegistry,
  preferredDefaultRecipeOrder,
  removedDefaultRecipeHistory,
  removedDefaultRecipeIds,
  removedDefaultRecipeNames,
  requiredDefaultRecipeNames,
} from "../lib/recipes/defaultRecipeRegistry.ts";

test("default recipe registry is the canonical source for active catalog metadata", () => {
  assert.deepEqual(
    defaultRecipes,
    defaultRecipeRegistry.map(({ recipe }) => recipe),
  );
  assert.deepEqual(
    defaultRecipeCatalogEntries,
    defaultRecipes.map(({ id, name }) => ({ id, name })),
  );
  assert.deepEqual(
    preferredDefaultRecipeOrder,
    defaultRecipes.map(({ id }) => id),
  );
  assert.deepEqual(
    requiredDefaultRecipeNames,
    defaultRecipeRegistry
      .filter((entry) => entry.requiredForDeploy)
      .map(({ recipe }) => recipe.name),
  );
  assert.deepEqual(
    removedDefaultRecipeIds,
    removedDefaultRecipeHistory.map(({ id }) => id),
  );
  assert.deepEqual(
    removedDefaultRecipeNames,
    removedDefaultRecipeHistory.map(({ name }) => name),
  );
  assert.equal(
    defaultRecipes.some((recipe) => removedDefaultRecipeIds.includes(recipe.id)),
    false,
  );
});

test("default recipe aliases target active registry entries", () => {
  const activeIds = new Set(defaultRecipes.map(({ id }) => id));

  for (const [alias, target] of Object.entries(defaultRecipeIdAliases)) {
    assert.equal(activeIds.has(alias), false, `${alias} must not be an active id`);
    assert.equal(activeIds.has(target), true, `${alias} must target an active recipe`);
  }
});

test("main page imports shared types and contains no embedded legacy catalog", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /from "@\/data\/defaultRecipes"/);
  assert.match(page, /from "@\/lib\/types\/defaultRecipe"/);
  assert.doesNotMatch(page, /const legacyRecipes/);
  assert.doesNotMatch(page, /type Recipe =/);
  assert.doesNotMatch(page, /정인성 4666 오리지널/);
});
