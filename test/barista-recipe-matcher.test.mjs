import assert from "node:assert/strict";
import test from "node:test";

import { baristaRecipes } from "../data/baristaRecipes.ts";
import {
  rankBaristaRecipes,
  selectBaristaRecipe,
} from "../lib/recommendation/baristaRecipeMatcher.ts";

const baseInput = {
  brewerType: "v60",
  drinkStyle: "hot",
  roastLevel: "medium-light",
  process: "washed",
  tasteGoal: "balanced",
  doseGrams: 20,
  flavorNotes: [],
};

test("initial catalog contains HOT V60 references with grind intent", () => {
  assert.equal(baristaRecipes.length, 6);
  assert.ok(
    baristaRecipes.every(
      (recipe) =>
        recipe.brewerType === "v60" &&
        recipe.drinkStyle === "hot" &&
        recipe.grindIntent.originalDescription.length > 0,
    ),
  );
});

test("bright light-roast matching uses flavor notes to break close candidates", () => {
  const match = selectBaristaRecipe({
    ...baseInput,
    roastLevel: "light",
    tasteGoal: "bright",
    flavorNotes: ["클린"],
  });

  assert.ok(match);
  assert.equal(match.recipe.id, "jis-4666");
  assert.ok(match.score >= 90);
  assert.ok(match.reasons.some((reason) => reason.includes("산미·향미")));
  assert.ok(match.reasons.some((reason) => reason.includes("클린")));
});

test("sweet matching prefers the recipe whose cup profile and dose align", () => {
  const match = selectBaristaRecipe({
    ...baseInput,
    process: "natural",
    tasteGoal: "sweet",
    doseGrams: 18,
  });

  assert.ok(match);
  assert.equal(match.recipe.id, "jis-ver2-hot");
  assert.ok(match.reasons.some((reason) => reason.includes("원본 18g")));
});

test("balanced 15g matching selects the closest reproducible home recipe", () => {
  const matches = rankBaristaRecipes(
    {
      ...baseInput,
      roastLevel: "medium",
      tasteGoal: "balanced",
      doseGrams: 15,
    },
    3,
  );

  assert.equal(matches.length, 3);
  assert.equal(matches[0].recipe.id, "deepblue-v60");
  assert.ok(matches[0].score > matches[1].score);
});

test("body matching favors the stronger-ratio 4:6 reference", () => {
  const match = selectBaristaRecipe({
    ...baseInput,
    roastLevel: "medium",
    process: "natural",
    tasteGoal: "body",
  });

  assert.ok(match);
  assert.equal(match.recipe.id, "tetsu-46");
  assert.equal(match.recipe.grindIntent.targetFlow, "fast");
});

test("unsupported brewer and drink-style scopes return no false match", () => {
  assert.deepEqual(
    rankBaristaRecipes({
      ...baseInput,
      brewerType: "clever",
    }),
    [],
  );
  assert.deepEqual(
    rankBaristaRecipes({
      ...baseInput,
      drinkStyle: "iced",
    }),
    [],
  );
});
