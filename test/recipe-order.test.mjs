import assert from "node:assert/strict";
import test from "node:test";

import { defaultRecipes } from "../data/defaultRecipes.ts";
import {
  moveRecipeId,
  moveRecipeIdToTarget,
  reconcileRecipeOrder,
  resolveStoredRecipeOrder,
} from "../lib/recipes/useRecipeOrder.ts";

test("stored recipe names migrate to stable recipe ids", () => {
  const first = defaultRecipes[0];
  const second = defaultRecipes[1];

  assert.deepEqual(
    resolveStoredRecipeOrder([second.name, first.id, "삭제된 레시피"], defaultRecipes),
    [second.id, first.id],
  );
});

test("recipe order preserves known ids, drops deleted ids, and appends new ids", () => {
  assert.deepEqual(
    reconcileRecipeOrder(["a", "b", "c", "d"], ["c", "removed", "a"]),
    ["c", "a", "b", "d"],
  );
});

test("recipe order movement is immutable and bounded", () => {
  const original = ["a", "b", "c"];

  assert.deepEqual(moveRecipeId(original, "b", -1), ["b", "a", "c"]);
  assert.deepEqual(moveRecipeId(original, "a", -1), original);
  assert.deepEqual(original, ["a", "b", "c"]);
});

test("drag target movement reorders ids without DOM mutation", () => {
  assert.deepEqual(
    moveRecipeIdToTarget(["a", "b", "c", "d"], "a", "c"),
    ["b", "c", "a", "d"],
  );
  assert.deepEqual(
    moveRecipeIdToTarget(["a", "b", "c", "d"], "d", "b"),
    ["a", "d", "b", "c"],
  );
});
