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

test("ranking remains unchanged when no personal history is supplied", () => {
  const first = rankBaristaRecipes(baseInput, 6).map((match) => match.recipe.id);
  const second = rankBaristaRecipes(
    { ...baseInput, personalRecipeStatuses: {} },
    6,
  ).map((match) => match.recipe.id);

  assert.deepEqual(second, first);
});

test("provisional personal history adds 10 points and raises only that recipe", () => {
  const baseline = rankBaristaRecipes(baseInput, 6);
  const boosted = rankBaristaRecipes(
    {
      ...baseInput,
      personalRecipeStatuses: { "anstar-6888": "provisional" },
    },
    6,
  );
  const baselineIndex = baseline.findIndex(
    (match) => match.recipe.id === "anstar-6888",
  );
  const boostedIndex = boosted.findIndex(
    (match) => match.recipe.id === "anstar-6888",
  );
  const baselineScore = baseline[baselineIndex].score;
  const boostedMatch = boosted[boostedIndex];

  assert.equal(boostedMatch.score, baselineScore + 10);
  assert.ok(boostedIndex < baselineIndex);
  assert.ok(
    boostedMatch.reasons.some((reason) => reason.includes("[개인 성공] 잠정")),
  );
});

test("stable personal history adds 20 points and can promote the recipe to first", () => {
  const baseline = rankBaristaRecipes(baseInput, 6);
  const boosted = rankBaristaRecipes(
    {
      ...baseInput,
      personalRecipeStatuses: { "anstar-6888": "stable" },
    },
    6,
  );
  const baselineMatch = baseline.find(
    (match) => match.recipe.id === "anstar-6888",
  );

  assert.ok(baselineMatch);
  assert.equal(boosted[0].recipe.id, "anstar-6888");
  assert.equal(boosted[0].score, Math.min(100, baselineMatch.score + 20));
  assert.ok(
    boosted[0].reasons.some((reason) => reason.includes("[개인 성공] 안정")),
  );
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
