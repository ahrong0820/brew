import assert from "node:assert/strict";
import test from "node:test";

import { applyBaristaRecipeRecommendation } from "#barista-recipe-recommendation";

const timestamp = "2026-06-27T00:00:00Z";

const baseRecommendation = {
  templateName: "V60 밸런스형 4회 푸어",
  doseGrams: 20,
  waterGrams: 320,
  ratio: 16,
  temperatureCelsius: 94,
  targetTimeMinSeconds: 150,
  targetTimeMaxSeconds: 180,
  grinder: {
    displayValue: "7.0",
    displayRange: "6.8~7.2",
    commonDescription: "중간~중간보다 약간 굵게",
    calibrationLabel: "버 비접촉 영점",
    isNumeric: true,
    note: "기존 HOT V60 기준 분쇄 시작값입니다.",
  },
  steps: [
    {
      label: "블루밍",
      startSeconds: 0,
      targetWaterGrams: 60,
      cue: "기존 기준 단계",
    },
    {
      label: "본 추출",
      startSeconds: 30,
      targetWaterGrams: 320,
      cue: "기존 기준 단계",
    },
  ],
  reasons: ["기존 추천 근거"],
  confidence: "medium",
  confidenceReason: "기존 추천 신뢰도",
  appliedRules: [
    {
      id: "ratio.v60-hot-paper.foundation-1-to-16.v1",
      parameter: "ratio",
      description: "기존 비율",
      evidence: [],
    },
    {
      id: "pour.v60-hot-paper.foundation.v1",
      parameter: "pour",
      description: "기존 푸어",
      evidence: [],
    },
    {
      id: "time.v60-hot-paper.foundation.v1",
      parameter: "time",
      description: "기존 시간",
      evidence: [],
    },
    {
      id: "grind.v60-hot-paper.reference-start-no-bean-offsets.v1",
      parameter: "grind",
      description: "기존 분쇄도",
      evidence: [],
    },
  ],
};

function createInput(overrides = {}) {
  const input = {
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
  };

  return {
    ...input,
    ...overrides,
    bean: { ...input.bean, ...(overrides.bean ?? {}) },
    grinder: { ...input.grinder, ...(overrides.grinder ?? {}) },
    preferences: {
      ...input.preferences,
      ...(overrides.preferences ?? {}),
    },
  };
}

test("HOT V60 recommendation applies the selected barista recipe structure", () => {
  const result = applyBaristaRecipeRecommendation(
    baseRecommendation,
    createInput(),
  );

  assert.equal(result.templateName, "정인성 4666 오리지널");
  assert.equal(result.ratio, 16);
  assert.equal(result.waterGrams, 320);
  assert.equal(result.temperatureCelsius, 92);
  assert.equal(result.targetTimeMinSeconds, 130);
  assert.equal(result.targetTimeMaxSeconds, 160);
  assert.equal(result.steps.length, 5);
  assert.equal(result.steps.at(-1).label, "후가수");
  assert.equal(result.steps.at(-1).targetWaterGrams, 320);
  assert.equal(result.grinder.displayValue, "7.8");
  assert.equal(result.grinder.commonDescription, "중간보다 굵은 분쇄");
  assert.ok(result.reasons[0].includes("정인성"));
  assert.ok(
    result.appliedRules.some(
      (rule) => rule.id === "recipe.hot-v60.barista-catalog-match.v1",
    ),
  );
  assert.ok(
    result.appliedRules.some(
      (rule) =>
        rule.id === "grind.v60-hot-paper.reference-start-no-bean-offsets.v1",
    ),
  );
  assert.ok(
    !result.appliedRules.some(
      (rule) => rule.id === "pour.v60-hot-paper.foundation.v1",
    ),
  );
});

test("sweet goal selects the matching recipe and keeps personal offsets", () => {
  const result = applyBaristaRecipeRecommendation(
    { ...baseRecommendation, doseGrams: 18 },
    createInput({
      bean: {
        roastLevel: "medium-light",
        process: "natural",
        flavorNotes: ["단맛"],
      },
      preferences: {
        defaultDoseGrams: 18,
        defaultWaterGrams: 300,
        defaultTasteGoal: "sweet",
      },
      tasteGoal: "sweet",
      recommendationOffset: {
        ratio: 0.5,
        temperature: 2,
      },
    }),
  );

  assert.equal(result.templateName, "정인성 국룰 Ver 2.0 HOT");
  assert.equal(result.ratio, 17.2);
  assert.equal(result.waterGrams, 310);
  assert.equal(result.temperatureCelsius, 92);
  assert.equal(result.steps.at(-1).targetWaterGrams, 310);
});

test("unsupported scopes and doses keep the existing recommendation", () => {
  const clever = applyBaristaRecipeRecommendation(
    baseRecommendation,
    createInput({
      preferences: { defaultBrewer: "clever" },
    }),
  );
  const iced = applyBaristaRecipeRecommendation(
    baseRecommendation,
    createInput({
      preferences: { defaultDrinkStyle: "iced" },
    }),
  );
  const oversized = applyBaristaRecipeRecommendation(
    { ...baseRecommendation, doseGrams: 30 },
    createInput({
      preferences: { defaultDoseGrams: 30 },
    }),
  );

  assert.equal(clever, baseRecommendation);
  assert.equal(iced, baseRecommendation);
  assert.equal(oversized.templateName, baseRecommendation.templateName);
  assert.equal(oversized.steps, baseRecommendation.steps);
});
