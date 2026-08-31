import assert from "node:assert/strict";
import test from "node:test";

import { getAdjacentRecipeId } from "./recipeOrderNavigation.ts";

test("getAdjacentRecipeId returns the neighboring visible recipe id", () => {
  const ids = ["recipe-a", "recipe-b", "recipe-c"];

  assert.equal(getAdjacentRecipeId(ids, "recipe-b", -1), "recipe-a");
  assert.equal(getAdjacentRecipeId(ids, "recipe-b", 1), "recipe-c");
});

test("getAdjacentRecipeId returns null at boundaries or for unknown ids", () => {
  const ids = ["recipe-a", "recipe-b"];

  assert.equal(getAdjacentRecipeId(ids, "recipe-a", -1), null);
  assert.equal(getAdjacentRecipeId(ids, "recipe-b", 1), null);
  assert.equal(getAdjacentRecipeId(ids, "missing", 1), null);
});
