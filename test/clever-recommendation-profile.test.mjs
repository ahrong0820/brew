import assert from "node:assert/strict";
import test from "node:test";

import { baristaRecipes } from "../data/expandedBaristaRecipes.ts";
import {
  applyCleverRecommendationProfile,
  cleverGrindRange,
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
    {
      label: "물 붓기",
      startSeconds: 0,
      targetWaterGrams: 250,
      cue: "물을 먼저 붓기",
    },
    {
      label: "커피 투입",
      startSeconds: 5,
      targetWaterGrams: 250,
      cue: "커피를 넣고 저어 주기",
    },
    {
      label: "드로다운",
      startSeconds: 120,
      targetWaterGrams: 250,
      cue: "서버에 올려 드로다운",
    },
  ],
};

const grinder = {
  id: "grinder-1",
  model: "1zpresso-k-ultra",
  displayName: "K-Ultra",
  calibrationProfile: "user-zero",
  calibrationLabel: "사용자 영점",
  calibrationStatus: "user-calibrated",
  recommendationStatus: "primary",
  displayUnit: "dial",
  adjustmentDirection: "higher-is-coarser",
  displayStep: 0.1,
  personalOffset: 0,
  notes: [],
  isBuiltIn: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const recommendation = {
  templateName: recipe.name,
  sourceRecipeId: recipe.id,
  sourceStatus: "reference",
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
    safeRangeLabel: "5.0~10.0",
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
  grinder,
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

test("reference Clever separates immersion and drawdown timing", () => {
  assert.deepEqual(cleverTiming(recipe), {
    immersionSeconds: 120,
    drawdownMinSeconds: 45,
    drawdownMaxSeconds: 75,
    totalMinSeconds: 165,
    totalMaxSeconds: 195,
  });
});

test("reference Clever immersion offset changes only immersion and total timing", () => {
  assert.deepEqual(cleverTiming(recipe, 15), {
    immersionSeconds: 135,
    drawdownMinSeconds: 45,
    drawdownMaxSeconds: 75,
    totalMinSeconds: 180,
    totalMaxSeconds: 210,
  });
});

test("Clever temperature follows roast level", () => {
  assert.equal(cleverTemperatureForRoast("light", 92), 95);
  assert.equal(cleverTemperatureForRoast("medium", 94), 92);
  assert.equal(cleverTemperatureForRoast("dark", 94), 88);
});

test("Clever grind range stays near the converted start and inside safe bounds", () => {
  assert.equal(cleverGrindRange(recommendation.grinder, grinder), "6.5~7.5");
});

test("reference Clever profile adds immersion-specific rules and cues", () => {
  const result = applyCleverRecommendationProfile(recommendation, recipe, input);
  assert.equal(result.temperatureCelsius, 95);
  assert.equal(result.targetTimeMinSeconds, 165);
  assert.equal(result.targetTimeMaxSeconds, 195);
  assert.equal(result.grinder.displayRange, "6.5~7.5");
  assert.match(result.steps[1].cue, /교반.*1회/);
  assert.match(result.steps[2].cue, /드로다운 45~75초/);
  assert.ok(result.reasons.some((reason) => reason.startsWith("[클레버 구조]")));
  assert.ok(result.reasons.some((reason) => reason.startsWith("[클레버 분쇄]")));
  assert.ok(
    result.appliedRules.some(
      (rule) => rule.id === "time.clever.immersion-drawdown.v1",
    ),
  );
});

test("stored Clever technique offsets update the next reference recipe", () => {
  const result = applyCleverRecommendationProfile(recommendation, recipe, {
    ...input,
    recommendationOffset: {
      agitation: -1,
      "immersion-time": 15,
    },
  });
  assert.equal(result.targetTimeMinSeconds, 180);
  assert.equal(result.targetTimeMaxSeconds, 210);
  assert.equal(result.steps[2].startSeconds, 135);
  assert.match(result.steps[1].cue, /교반 생략/);
});

test("verified Clever recipe preserves exact source timing and temperature", () => {
  const official = baristaRecipes.find(
    (candidate) => candidate.id === "clever-official-distributor-185",
  );
  assert.ok(official);
  assert.equal(official.sourceStatus, "verified");
  assert.deepEqual(cleverTiming(official), {
    immersionSeconds: 75,
    drawdownMinSeconds: 75,
    drawdownMaxSeconds: 90,
    totalMinSeconds: 150,
    totalMaxSeconds: 165,
  });

  const result = applyCleverRecommendationProfile(
    {
      ...recommendation,
      templateName: official.name,
      sourceRecipeId: official.id,
      sourceStatus: official.sourceStatus,
      doseGrams: official.doseGrams,
      waterGrams: official.waterGrams,
      ratio: official.ratio,
      temperatureCelsius: 96,
      targetTimeMinSeconds: official.targetTimeMinSeconds,
      targetTimeMaxSeconds: official.targetTimeMaxSeconds,
      steps: official.steps,
    },
    official,
    {
      ...input,
      preferences: {
        ...input.preferences,
        defaultDoseGrams: 19,
        defaultWaterGrams: 318,
      },
    },
  );

  assert.equal(result.temperatureCelsius, 100);
  assert.equal(result.targetTimeMinSeconds, 150);
  assert.equal(result.targetTimeMaxSeconds, 165);
  assert.equal(result.confidence, "medium");
  assert.match(result.confidenceReason, /수치·절차가 일치/);
  assert.match(result.steps.at(-1).cue, /75~90초/);
  assert.ok(result.reasons.some((reason) => reason.startsWith("[공식 원본]")));
  assert.ok(
    result.appliedRules.some((rule) =>
      rule.evidence.some(
        (evidence) =>
          evidence.kind === "manufacturer" &&
          evidence.applicability === "direct",
      ),
    ),
  );
});
