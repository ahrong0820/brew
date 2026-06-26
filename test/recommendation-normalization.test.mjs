import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRatioAndWater,
  normalizeDoseGrams,
  normalizeRecommendation,
  normalizeRecommendationForGrinder,
  normalizeRecommendationSteps,
  recommendedRatioForTaste,
  recommendedWaterGrams,
  roundWaterGrams,
} from "../lib/recommendation/normalization.ts";

const baseRecommendation = {
  templateName: "테스트 추천",
  doseGrams: 15,
  waterGrams: 240,
  ratio: 16,
  temperatureCelsius: 92,
  targetTimeMinSeconds: 150,
  targetTimeMaxSeconds: 195,
  grinder: {
    displayValue: "7.0",
    displayRange: "6.8~7.2",
    commonDescription: "중간 분쇄",
    calibrationLabel: "비접촉 영점",
    isNumeric: true,
    note: "테스트",
  },
  steps: [
    { label: "블루밍", startSeconds: 0, targetWaterGrams: 40, cue: "적시기" },
    { label: "1차 추출", startSeconds: 40, targetWaterGrams: 140, cue: "붓기" },
    { label: "2차 추출", startSeconds: 75, targetWaterGrams: 240, cue: "마무리" },
  ],
  reasons: [],
  confidence: "medium",
  confidenceReason: "테스트",
  appliedRules: [],
};

const kUltra = {
  model: "1zpresso-k-ultra",
  displayUnit: "dial",
  displayStep: 0.1,
  personalOffset: 0,
};

test("taste ratios and water calculations use one canonical table", () => {
  assert.equal(recommendedRatioForTaste("sweet"), 15.5);
  assert.equal(recommendedRatioForTaste("bright"), 16.5);
  assert.equal(recommendedRatioForTaste("balanced"), 16);
  assert.equal(recommendedRatioForTaste("body"), 15);
  assert.equal(recommendedWaterGrams(15, 15.5), 235);
  assert.equal(roundWaterGrams(232.5), 235);
});

test("dose, ratio, temperature, time and cumulative pours normalize idempotently", () => {
  const normalized = normalizeRecommendation({
    ...baseRecommendation,
    doseGrams: 100,
    waterGrams: 243,
    ratio: 18.8,
    temperatureCelsius: 99,
    targetTimeMinSeconds: 200,
    targetTimeMaxSeconds: 150,
    steps: [
      { label: "블루밍", startSeconds: 0, targetWaterGrams: 43, cue: "적시기" },
      { label: "1차 추출", startSeconds: 40, targetWaterGrams: 300, cue: "붓기" },
      { label: "2차 추출", startSeconds: 20, targetWaterGrams: 200, cue: "마무리" },
    ],
  });

  assert.equal(normalizeDoseGrams(100), 40);
  assert.equal(normalized.doseGrams, 40);
  assert.equal(normalized.waterGrams, 245);
  assert.equal(normalized.ratio, 18);
  assert.equal(normalized.temperatureCelsius, 96);
  assert.equal(normalized.targetTimeMinSeconds, 200);
  assert.equal(normalized.targetTimeMaxSeconds, 200);
  assert.deepEqual(
    normalized.steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [0, 45],
      [40, 245],
      [40, 245],
    ],
  );
  assert.deepEqual(normalizeRecommendation(normalized), normalized);
});

test("ratio changes update total water and the final cumulative pour together", () => {
  const adjusted = applyRatioAndWater(baseRecommendation, 15.5);

  assert.equal(adjusted.ratio, 15.5);
  assert.equal(adjusted.waterGrams, 235);
  assert.equal(adjusted.steps.at(-1).targetWaterGrams, 235);
  assert.ok(
    adjusted.steps.every(
      (step, index) =>
        index === 0 ||
        step.targetWaterGrams >= adjusted.steps[index - 1].targetWaterGrams,
    ),
  );
});

test("numeric grinder values and displayed ranges stay inside supported bounds", () => {
  const normalized = normalizeRecommendationForGrinder(
    {
      ...baseRecommendation,
      grinder: {
        ...baseRecommendation.grinder,
        displayValue: "8.7",
        displayRange: "8.5~8.9",
      },
    },
    kUltra,
    { deriveWaterFromRatio: true },
  );

  assert.equal(normalized.grinder.displayValue, "8.5");
  assert.equal(normalized.grinder.displayRange, "8.3~8.5");
  assert.equal(normalized.waterGrams, 240);
});

test("step normalization always uses cumulative targets and exact final water", () => {
  const steps = normalizeRecommendationSteps(
    [
      { label: "A", startSeconds: 10, targetWaterGrams: 52, cue: "A" },
      { label: "B", startSeconds: 5, targetWaterGrams: 48, cue: "B" },
      { label: "C", startSeconds: 30, targetWaterGrams: 500, cue: "C" },
    ],
    203,
  );

  assert.deepEqual(
    steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [10, 50],
      [10, 50],
      [30, 205],
    ],
  );
});
