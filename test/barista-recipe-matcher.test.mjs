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

const removedRecipeIds = [
  "signature-cone",
  "deepblue-v60",
  "jis-4666",
  "anstar-6888",
];

test("active V60 catalog contains only source-audited current recipes", () => {
  assert.equal(baristaRecipes.length, 5);
  assert.ok(
    baristaRecipes.every(
      (recipe) =>
        recipe.brewerType === "v60" &&
        recipe.drinkStyle === "hot" &&
        recipe.grindIntent.originalDescription.length > 0 &&
        recipe.sourceUrl,
    ),
  );
  assert.ok(
    removedRecipeIds.every(
      (recipeId) => !baristaRecipes.some((recipe) => recipe.id === recipeId),
    ),
  );
  const anstar = baristaRecipes.find(
    (recipe) => recipe.id === "anstar-multiserve-20g-2024",
  );
  assert.ok(anstar);
  assert.equal(anstar.sourceStatus, "partial");
  assert.equal(anstar.temperatureCelsius, undefined);
});

test("bright light-roast matching uses the retained official 4:6 reference", () => {
  const match = selectBaristaRecipe({
    ...baseInput,
    roastLevel: "light",
    tasteGoal: "bright",
    flavorNotes: ["클린"],
  });

  assert.ok(match);
  assert.equal(match.recipe.id, "tetsu-46");
  assert.ok(match.score >= 80);
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

test("balanced 15g matching selects the current low-dose 484 recipe", () => {
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
  assert.equal(matches[0].recipe.id, "jis-484-15g-2026");
  assert.ok(matches[0].score > matches[1].score);
});

test("the current Anstar multi-serving source can be selected explicitly", () => {
  const match = selectBaristaRecipe(
    baseInput,
    "anstar-multiserve-20g-2024",
  );

  assert.ok(match);
  assert.equal(match.recipe.name, "안스타 6888");
  assert.equal(match.recipe.sourceStatus, "partial");
  assert.match(match.recipe.steps[0].cue, /기존 앱 전사 시작값/);
});

test("ranking remains unchanged when no personal history is supplied", () => {
  const first = rankBaristaRecipes(baseInput, 4).map((match) => match.recipe.id);
  const second = rankBaristaRecipes(
    { ...baseInput, personalRecipeStatuses: {} },
    4,
  ).map((match) => match.recipe.id);

  assert.deepEqual(second, first);
});

test("provisional personal history adds 10 points only to that current recipe", () => {
  const baseline = rankBaristaRecipes(baseInput, 4);
  const boosted = rankBaristaRecipes(
    {
      ...baseInput,
      personalRecipeStatuses: { "tetsu-neo-2026": "provisional" },
    },
    4,
  );
  const baselineMatch = baseline.find(
    (match) => match.recipe.id === "tetsu-neo-2026",
  );
  const boostedMatch = boosted.find(
    (match) => match.recipe.id === "tetsu-neo-2026",
  );

  assert.ok(baselineMatch);
  assert.ok(boostedMatch);
  assert.equal(boostedMatch.score, Math.min(100, baselineMatch.score + 10));
  assert.ok(
    boostedMatch.reasons.some((reason) => reason.includes("[개인 성공] 잠정")),
  );
});

test("stable personal history can promote the latest NEO recipe to first", () => {
  const baseline = rankBaristaRecipes(baseInput, 4);
  const boosted = rankBaristaRecipes(
    {
      ...baseInput,
      personalRecipeStatuses: { "tetsu-neo-2026": "stable" },
    },
    4,
  );
  const baselineMatch = baseline.find(
    (match) => match.recipe.id === "tetsu-neo-2026",
  );

  assert.ok(baselineMatch);
  assert.equal(boosted[0].recipe.id, "tetsu-neo-2026");
  assert.equal(boosted[0].score, Math.min(100, baselineMatch.score + 20));
  assert.ok(
    boosted[0].reasons.some((reason) => reason.includes("[개인 성공] 안정")),
  );
});

test("medium-roast body matching retains the classic 4:6 reference", () => {
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

test("Clever HOT matching returns the reference immersion recipe", () => {
  const match = selectBaristaRecipe({
    ...baseInput,
    brewerType: "clever",
    doseGrams: 15,
  });

  assert.ok(match);
  assert.equal(match.recipe.id, "clever-balanced-reference");
  assert.equal(match.recipe.sourceStatus, "reference");
  assert.equal(match.recipe.grindIntent.targetFlow, "moderate");
});

test("unsupported drink style returns no false match", () => {
  assert.deepEqual(
    rankBaristaRecipes({
      ...baseInput,
      drinkStyle: "iced",
    }),
    [],
  );
});
