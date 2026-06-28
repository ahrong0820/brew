import assert from "node:assert/strict";
import test from "node:test";

import { baristaRecipes as expandedRecipes } from "../data/expandedBaristaRecipes.ts";
import { recipeSourceRegistry } from "../data/recipeSourceRegistry.ts";

test("source records cover the recipe catalog", () => {
  assert.equal(recipeSourceRegistry.length, expandedRecipes.length);
  assert.equal(
    new Set(recipeSourceRegistry.map((record) => record.recipeId)).size,
    recipeSourceRegistry.length,
  );
  assert.deepEqual(
    new Set(recipeSourceRegistry.map((record) => record.recipeId)),
    new Set(expandedRecipes.map((recipe) => recipe.id)),
  );
});

test("source checks map to verified, partial and reference states", () => {
  for (const recipe of expandedRecipes) {
    const source = recipeSourceRegistry.find(
      (record) => record.recipeId === recipe.id,
    );
    assert.ok(source);
    assert.equal(
      recipe.sourceStatus,
      source.check === "exact"
        ? "verified"
        : source.check === "partial"
          ? "partial"
          : "reference",
    );
  }
});

test("audited labels replace the legacy generic label", () => {
  assert.ok(
    expandedRecipes.every(
      (recipe) => recipe.sourceLabel !== "기존 앱 공개 레시피 카탈로그",
    ),
  );
});
