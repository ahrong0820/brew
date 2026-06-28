import assert from "node:assert/strict";
import test from "node:test";

import {
  rankBaristaRecipes,
  selectBaristaRecipe,
} from "#barista-recipe-matcher";
import { applyBaristaRecipeRecommendation } from "#barista-recipe-recommendation";

const timestamp = "2026-06-27T00:00:00Z";

const matchInput = {
  brewerType: "v60",
  drinkStyle: "hot",
  roastLevel: "light",
  process: "washed",
  tasteGoal: "bright",
  doseGrams: 20,
  flavorNotes: ["클린"],
};

const recommendation = {
  templateName: "기존 추천",
  doseGrams: 20,
  waterGrams: 320,
  ratio: 16,
  temperatureCelsius: 94,
  targetTimeMinSeconds: 150,
  targetTimeMaxSeconds: 180,
  grinder: {
    displayValue: "7.0",
    displayRange: "6.8~7.2",
    commonDescription: "중간 분쇄",
    calibrationLabel: "버 비접촉 영점",
    isNumeric: true,
    note: "기존 시작값",
  },
  steps: [],
  reasons: [],
  confidence: "reference",
  confidenceReason: "참고",
  appliedRules: [],
};

function recommendationInput(baristaRecipeId) {
  return {
    bean: {
      id: "bean-1",
      name: "테스트 원두",
      originCountry: "ethiopia",
      originGroup: "east-africa",
      roastLevel: "light",
      process: "washed",
      flavorNotes: ["클린"],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    grinder: {
      id: "grinder-1",
      model: "1zpresso-k-ultra",
      displayName: "1Zpresso K-Ultra",
      calibrationProfile: "burr-no-rub",
      calibrationLabel: "버 비접촉 영점",
      calibrationStatus: "user-calibrated",
      recommendationStatus: "primary",
      displayUnit: "dial",
      adjustmentDirection: "higher-is-coarser",
      displayStep: 0.1,
      personalOffset: 0,
      notes: [],
      isBuiltIn: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    preferences: {
      defaultBrewer: "v60",
      defaultDoseGrams: 20,
      defaultWaterGrams: 320,
      defaultDrinkStyle: "hot",
      defaultGrinderProfileId: "grinder-1",
      defaultTasteGoal: "bright",
      updatedAt: timestamp,
    },
    tasteGoal: "bright",
    baristaRecipeId,
  };
}

test("ranked matching returns one primary current recipe and two alternatives", () => {
  const matches = rankBaristaRecipes(matchInput, 3);

  assert.equal(matches.length, 3);
  assert.equal(matches[0].recipe.id, "tetsu-46");
  assert.ok(matches[0].score >= matches[1].score);
  assert.ok(matches[1].score >= matches[2].score);
  assert.equal(new Set(matches.map((match) => match.recipe.id)).size, 3);
});

test("an eligible preferred recipe overrides the first-ranked recipe", () => {
  const matches = rankBaristaRecipes(matchInput, 3);
  const alternative = matches[1];
  const selected = selectBaristaRecipe(matchInput, alternative.recipe.id);

  assert.ok(selected);
  assert.equal(selected.recipe.id, alternative.recipe.id);
  assert.notEqual(selected.recipe.id, matches[0].recipe.id);
});

test("an unsupported preferred recipe is not silently substituted", () => {
  assert.equal(selectBaristaRecipe(matchInput, "missing-recipe"), undefined);
});

test("selected alternative changes the applied recipe and preserves grinder calibration", () => {
  const matches = rankBaristaRecipes(matchInput, 3);
  const alternative = matches[1];
  const result = applyBaristaRecipeRecommendation(
    recommendation,
    recommendationInput(alternative.recipe.id),
  );

  assert.equal(result.sourceRecipeId, alternative.recipe.id);
  assert.equal(result.templateName, alternative.recipe.name);
  assert.equal(result.grinder.displayValue, "7.8");
  assert.equal(
    result.grinder.commonDescription,
    alternative.recipe.grindIntent.originalDescription,
  );
  assert.ok(result.reasons.some((reason) => reason.includes(alternative.recipe.author)));
});
