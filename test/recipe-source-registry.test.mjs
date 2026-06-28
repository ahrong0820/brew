import assert from "node:assert/strict";
import test from "node:test";

import { baristaRecipes as expandedRecipes } from "../data/expandedBaristaRecipes.ts";
import { recipeSourceRegistry } from "../data/recipeSourceRegistry.ts";

const officialCleverId = "clever-official-distributor-185";

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

test("only exact source checks promote recipes to verified", () => {
  for (const recipe of expandedRecipes) {
    const source = recipeSourceRegistry.find(
      (record) => record.recipeId === recipe.id,
    );
    assert.ok(source);
    assert.equal(
      recipe.sourceStatus,
      source.check === "exact" ? "verified" : "reference",
    );
  }
});

test("official Clever distributor recipe is exact and verified", () => {
  const source = recipeSourceRegistry.find(
    (record) => record.recipeId === officialCleverId,
  );
  const recipe = expandedRecipes.find((entry) => entry.id === officialCleverId);

  assert.equal(source?.check, "exact");
  assert.equal(
    source?.url,
    "https://cleverbrewing.coffee/products/clever-dripper",
  );
  assert.equal(recipe?.sourceStatus, "verified");
  assert.equal(recipe?.doseGrams, 18.5);
  assert.equal(recipe?.waterGrams, 310);
  assert.equal(recipe?.ratio, 16.75);
  assert.equal(recipe?.temperatureCelsius, 100);
  assert.equal(recipe?.targetTimeMinSeconds, 150);
  assert.equal(recipe?.targetTimeMaxSeconds, 165);
  assert.equal(recipe?.steps.find((step) => step.label === "드로다운")?.startSeconds, 75);
});

test("audited labels replace the legacy generic label", () => {
  assert.ok(
    expandedRecipes.every(
      (recipe) => recipe.sourceLabel !== "기존 앱 공개 레시피 카탈로그",
    ),
  );
});
