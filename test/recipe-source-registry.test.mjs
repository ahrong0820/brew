import assert from "node:assert/strict";
import test from "node:test";

import { baristaRecipes as auditedRecipes } from "../data/auditedBaristaRecipes.ts";
import { baristaRecipes as catalogRecipes } from "../data/baristaRecipes.ts";
import { recipeSourceRegistry } from "../data/recipeSourceRegistry.ts";

test("source records cover the recipe catalog", () => {
  assert.equal(recipeSourceRegistry.length, catalogRecipes.length);
  assert.equal(
    new Set(recipeSourceRegistry.map((record) => record.recipeId)).size,
    recipeSourceRegistry.length,
  );
});

test("non-exact source checks keep reference status", () => {
  assert.ok(recipeSourceRegistry.every((record) => record.check !== "exact"));
  assert.ok(auditedRecipes.every((recipe) => recipe.sourceStatus === "reference"));
});

test("audited labels replace the legacy generic label", () => {
  assert.ok(
    auditedRecipes.every(
      (recipe) => recipe.sourceLabel !== "기존 앱 공개 레시피 카탈로그",
    ),
  );
});
