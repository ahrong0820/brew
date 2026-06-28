import assert from "node:assert/strict";
import test from "node:test";

import { baristaRecipes } from "../data/expandedBaristaRecipes.ts";
import {
  applyCleverRecommendationProfile,
  cleverTiming,
} from "../lib/recommendation/cleverRecommendation.ts";

const official = baristaRecipes.find(
  (recipe) => recipe.id === "clever-official-distributor-185",
);

test("official Clever recipe is verified with exact source values", () => {
  assert.ok(official);
  assert.equal(official.sourceStatus, "verified");
  assert.equal(official.doseGrams, 18.5);
  assert.equal(official.waterGrams, 310);
  assert.equal(official.ratio, 16.75);
  assert.equal(official.temperatureCelsius, 100);
  assert.deepEqual(cleverTiming(official), {
    immersionSeconds: 75,
    drawdownMinSeconds: 75,
    drawdownMaxSeconds: 90,
    totalMinSeconds: 150,
    totalMaxSeconds: 165,
  });
});

test("verified Clever profile preserves official temperature, timing and evidence", () => {
  assert.ok(official);
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
    templateName: official.name,
    sourceRecipeId: official.id,
    sourceStatus: official.sourceStatus,
    doseGrams: official.doseGrams,
    waterGrams: official.waterGrams,
    ratio: official.ratio,
    temperatureCelsius: 96,
    targetTimeMinSeconds: official.targetTimeMinSeconds,
    targetTimeMaxSeconds: official.targetTimeMaxSeconds,
    grinder: {
      displayValue: "7.0",
      displayRange: "6.5~8.0",
      commonDescription: "중굵게",
      calibrationLabel: "사용자 영점",
      safeRangeLabel: "5.0~10.0",
      isNumeric: true,
      note: "참고",
    },
    steps: official.steps,
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
      defaultDoseGrams: 18.5,
      defaultWaterGrams: 310,
      defaultDrinkStyle: "hot",
      defaultGrinderProfileId: grinder.id,
      defaultTasteGoal: "balanced",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    tasteGoal: "balanced",
  };

  const result = applyCleverRecommendationProfile(
    recommendation,
    official,
    input,
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
