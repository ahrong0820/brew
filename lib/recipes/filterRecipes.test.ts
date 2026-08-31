import assert from "node:assert/strict";
import test from "node:test";

import { defaultRecipes } from "./defaultRecipeRegistry.ts";
import { filterRecipes } from "./filterRecipes.ts";

function idsFor(filter: string) {
  return filterRecipes(defaultRecipes, {
    query: "",
    filter,
    favoriteIds: [],
  }).map(({ id }) => id);
}

test("NEO filter contains the HARIO NEO 10-pour recipe only", () => {
  assert.deepEqual(idsFor("NEO"), ["tetsu-neo-2026"]);
  assert.equal(idsFor("V60").includes("tetsu-neo-2026"), false);
});

test("NEO Switch filter contains both dedicated Neo Switch recipes", () => {
  assert.deepEqual(idsFor("NEO 스위치"), [
    "yong-neo-reverse-switch-hot",
    "yong-neo-reverse-switch-ice",
  ]);
});

test("general Switch filter still contains the Neo Switch recipes", () => {
  const switchIds = idsFor("스위치");
  assert.equal(switchIds.includes("yong-neo-reverse-switch-hot"), true);
  assert.equal(switchIds.includes("yong-neo-reverse-switch-ice"), true);
});
