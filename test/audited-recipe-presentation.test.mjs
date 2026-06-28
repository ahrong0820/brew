import assert from "node:assert/strict";
import test from "node:test";

import { applyRatioAndWater } from "../lib/recommendation/recipeMath.ts";

function recommendation(sourceStatus, ratio, waterGrams) {
  return {
    templateName: "test",
    sourceRecipeId: "test-source",
    sourceStatus,
    doseGrams: 20,
    waterGrams,
    ratio,
    temperatureCelsius: 92,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 180,
    grinder: {
      displayValue: "7.0",
      displayRange: "6.5~7.5",
      commonDescription: "중간",
      calibrationLabel: "테스트",
      isNumeric: true,
      note: "테스트",
    },
    steps: [
      {
        label: "추출",
        startSeconds: 0,
        targetWaterGrams: waterGrams,
        cue: "테스트",
      },
    ],
    reasons: [],
    confidence: "reference",
    confidenceReason: "테스트",
  };
}

test("verified and partial source recipes bypass generic ratio normalization", () => {
  const official = recommendation("verified", 16.75, 310);
  const partial = recommendation("partial", 11, 220);

  assert.equal(applyRatioAndWater(official, official.ratio), official);
  assert.equal(applyRatioAndWater(partial, partial.ratio), partial);
});

test("reference recipes still use generic ratio and water normalization", () => {
  const reference = recommendation("reference", 15.2, 304);
  const normalized = applyRatioAndWater(reference, reference.ratio);

  assert.equal(normalized.ratio, 15);
  assert.equal(normalized.waterGrams, 300);
});
