import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCleverRecommendationProfile,
  cleverLoadingOrder,
  cleverTemperatureForRoast,
  cleverTiming,
} from "../lib/recommendation/cleverRecommendation.ts";

const recipe = {
  id: "clever-test",
  name: "클레버 테스트",
  author: "Brew",
  sourceLabel: "내부 참고",
  sourceStatus: "reference",
  brewerType: "clever",
  drinkStyle: "hot",
  doseGrams: 15,
  supportedDoseGrams: { min: 12, max: 22 },
  waterGrams: 250,
  ratio: 16.7,
  temperatureCelsius: 94,
  targetTimeMinSeconds: 150,
  targetTimeMaxSeconds: 210,
  tasteProfile: { sweet: 4, bright: 3, balanced: 5, body: 4 },
  suitableRoasts: ["light"],
  suitableProcesses: ["washed"],
  flavorKeywords: [],
  grindIntent: { originalDescription: "중굵게", targetFlow: "moderate" },
  difficulty: "easy",
  steps: [
    { label: "물 붓기", startSeconds: 0, targetWaterGrams: 250, cue: "물을 먼저 붓기" },
    { label: "커피 투입", startSeconds: 5, targetWaterGrams: 250, cue: "커피를 넣고 저어 주기" },
    { label: "드로다운", startSeconds: 120, targetWaterGrams: 250, cue: "서버에 올려 드로다운" },
  ],
};

const recommendation = {
  templateName: recipe.name,
  sourceRecipeId: recipe.id,
  doseGrams: 15,
  waterGrams: 250,
  ratio: 16.7,
  temperatureCelsius: 94,
  targetTimeMinSeconds: 150,
  targetTimeMaxSeconds: 210,
  grinder: {
    displayValue: "7.0",
    displayRange: "6.5~8.0",
    commonDescription: "중굵게",
    calibrationLabel: "사용자 영점",
    isNumeric: true,
    note: "참고",
  },
  steps: recipe.steps,
  reasons: [],
  confidence: "reference",
  confidenceReason: "참고",
  appliedRules: [],
};

const input = {
  bean: {
    id: "bean-1",
    name: "테스트 원두",
    originCountry: "ethiopia",
    originGroup: "east-africa",
    roastLevel: "light",
    process: "washed",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  grinder: {},
  preferences: {
    defaultBrewer: "clever",
    defaultDoseGrams: 15,
    defaultWaterGrams: 250,
    defaultDrinkStyle: "hot",
    defaultGrinderProfileId: "grinder-1",
    defaultTasteGoal: "balanced",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  tasteGoal: "balanced",
};

test("Clever loading order remains explicit", () => {
  assert.equal(cleverLoadingOrder(recipe), "water-first");
});

test("Clever separates immersion and drawdown timing", () => {
  assert.deepEqual(cleverTiming(recipe), {
    immersionSeconds: 120,
    drawdownMinSeconds: 45,
    drawdownMaxSeconds: 75,
    totalMinSeconds: 165,
    totalMaxSeconds: 195,
  });
});

test("Clever temperature follows roast level", () => {
  assert.equal(cleverTemperatureForRoast("light", 92), 95);
  assert.equal(cleverTemperatureForRoast("medium", 94), 92);
  assert.equal(cleverTemperatureForRoast("dark", 94), 88);
});

test("Clever profile adds immersion-specific rules and cues", () => {
  const result = applyCleverRecommendationProfile(recommendation, recipe, input);
  assert.equal(result.temperatureCelsius, 95);
  assert.equal(result.targetTimeMinSeconds, 165);
  assert.equal(result.targetTimeMaxSeconds, 195);
  assert.match(result.steps[1].cue, /교반은.*1회/);
  assert.match(result.steps[2].cue, /드로다운 45~75초/);
  assert.ok(result.reasons.some((reason) => reason.startsWith("[클레버 구조]")));
  assert.ok(
    result.appliedRules.some(
      (rule) => rule.id === "time.clever.immersion-drawdown.v1",
    ),
  );
});
