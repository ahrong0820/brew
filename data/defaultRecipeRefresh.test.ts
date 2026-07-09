import assert from "node:assert/strict";
import test from "node:test";
import { buildDefaultRecipes } from "./defaultRecipeRefresh.ts";
import {
  preferredDefaultRecipeOrder,
  removedDefaultRecipeIds,
  requiredDefaultRecipeNames,
} from "../lib/recipes/defaultRecipeCatalog.ts";
import type { Recipe } from "../lib/types/defaultRecipe.ts";

function recipe(id: string, name = id): Recipe {
  return {
    id,
    name,
    origin: "test",
    method: "V60",
    profile: "test",
    tags: ["V60"],
    dose: 20,
    water: 300,
    ratio: "1:15",
    temp: "92℃",
    grind: "medium",
    totalTime: 180,
    notes: [],
    steps: [
      {
        label: "start",
        start: 0,
        end: 180,
        targetWater: 300,
        cue: "brew",
      },
    ],
  };
}

test("buildDefaultRecipes removes stale recipes and inserts required refreshed recipes", () => {
  const refreshed = buildDefaultRecipes([
    recipe("tetsu-46"),
    recipe("signature-cone", "시그니쳐 로스터스 콘 필터"),
    recipe("deepblue-v60", "딥블루레이크 V60 HOT"),
    recipe("jis-4666", "정인성 4666 오리지널"),
    recipe("jis-clever-112", "정인성 클레버 1:12"),
  ]);
  const ids = refreshed.map((item) => item.id);
  const names = refreshed.map((item) => item.name);

  for (const removedId of removedDefaultRecipeIds) {
    assert.equal(ids.includes(removedId), false, `${removedId} should be removed`);
  }
  for (const requiredName of requiredDefaultRecipeNames) {
    assert.equal(names.includes(requiredName), true, `${requiredName} should be present`);
  }

  const preferredIdsPresentInResult = preferredDefaultRecipeOrder.filter((recipeId) =>
    ids.includes(recipeId),
  );
  assert.deepEqual(
    ids.slice(0, preferredIdsPresentInResult.length),
    preferredIdsPresentInResult,
  );
});
