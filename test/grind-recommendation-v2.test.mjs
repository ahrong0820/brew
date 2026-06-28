import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRecipeGrindRecommendation,
  grinderCalibrationBasis,
  grinderSafeRange,
  recipeGrindStart,
} from "../lib/recommendation/grindRecommendationV2.ts";

const timestamp = "2026-06-28T00:00:00Z";

function grinder(overrides = {}) {
  return {
    id: "grinder-test",
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
    ...overrides,
  };
}

function recipe(grindIntent) {
  return {
    id: "recipe-test",
    name: "테스트 레시피",
    author: "테스트",
    sourceLabel: "테스트 출처",
    sourceStatus: "reference",
    brewerType: "v60",
    drinkStyle: "hot",
    doseGrams: 15,
    supportedDoseGrams: { min: 12, max: 20 },
    waterGrams: 240,
    ratio: 16,
    temperatureCelsius: 92,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 180,
    tasteProfile: { sweet: 4, bright: 4, balanced: 4, body: 3 },
    suitableRoasts: ["light", "medium-light", "medium"],
    suitableProcesses: ["washed", "natural"],
    flavorKeywords: [],
    grindIntent,
    difficulty: "easy",
    steps: [],
  };
}

function recommendation() {
  return {
    templateName: "test",
    doseGrams: 15,
    waterGrams: 240,
    ratio: 16,
    temperatureCelsius: 92,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 180,
    grinder: {
      displayValue: "7.0",
      displayRange: "6.8~7.2",
      commonDescription: "중간 분쇄",
      calibrationLabel: "기존 기준",
      isNumeric: true,
      note: "기존 추천.",
    },
    steps: [],
    reasons: ["기존 이유"],
    confidence: "reference",
    confidenceReason: "test",
  };
}

function input(selectedGrinder, overrides = {}) {
  return {
    bean: {
      id: "bean-test",
      name: "Test Bean",
      originCountry: "ethiopia",
      originGroup: "east-africa",
      roastLevel: "medium-light",
      process: "washed",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    grinder: selectedGrinder,
    preferences: {
      defaultBrewer: "v60",
      defaultDoseGrams: 15,
      defaultWaterGrams: 240,
      defaultDrinkStyle: "hot",
      defaultGrinderProfileId: selectedGrinder.id,
      defaultTasteGoal: "balanced",
      updatedAt: timestamp,
    },
    tasteGoal: "balanced",
    ...overrides,
  };
}

test("calibration bases distinguish official, user, reference, and unknown profiles", () => {
  assert.equal(
    grinderCalibrationBasis(
      grinder({
        calibrationProfile: "manufacturer-resistance-start-zero",
        calibrationLabel: "제조사 저항 시작 영점",
      }),
    ),
    "official",
  );
  assert.equal(grinderCalibrationBasis(grinder()), "user");
  assert.equal(
    grinderCalibrationBasis(
      grinder({
        model: "baratza-encore",
        calibrationProfile: "factory-default",
        calibrationStatus: "factory",
        recommendationStatus: "reference",
        micronReference: {
          source: "reference",
          sourceLabel: "참고 곡선",
          points: [{ step: 20, microns: 880 }],
        },
      }),
    ),
    "reference",
  );
  assert.equal(
    grinderCalibrationBasis(
      grinder({
        model: "other",
        calibrationProfile: "unknown",
        calibrationStatus: "unknown",
        recommendationStatus: "disabled",
      }),
    ),
    "unknown",
  );
});

test("model and zero-point specific safety ranges are enforced", () => {
  assert.deepEqual(
    grinderSafeRange(
      grinder({ calibrationProfile: "manufacturer-resistance-start-zero" }),
    ),
    { min: 8, max: 9, width: 0.2 },
  );
  assert.deepEqual(grinderSafeRange(grinder()), {
    min: 5.5,
    max: 8.5,
    width: 0.2,
  });
  assert.deepEqual(
    grinderSafeRange(
      grinder({
        model: "baratza-encore",
        calibrationProfile: "factory-default",
        displayUnit: "click",
        displayStep: 1,
      }),
    ),
    { min: 8, max: 32, width: 2 },
  );
});

test("representative microns interpolate to a grinder number", () => {
  const e80 = grinder({
    model: "holzklotz-e80",
    displayName: "홀츠클로츠 E80",
    calibrationProfile: "manufacturer-step-micron",
    calibrationLabel: "제조사 Step-미크론 기준",
    calibrationStatus: "factory",
    recommendationStatus: "reference",
    displayUnit: "step",
    displayStep: 1,
    micronReference: {
      source: "manufacturer",
      sourceLabel: "제조사 표",
      points: [
        { step: 30, microns: 795 },
        { step: 40, microns: 1020 },
      ],
    },
  });
  const start = recipeGrindStart(
    recipe({
      originalDescription: "850μm",
      targetFlow: "moderate",
      representativeMicrons: { min: 850, max: 850 },
    }),
    e80,
  );

  assert.ok(start);
  assert.equal(start.source, "recipe-microns");
  assert.equal(start.value, 32);
  assert.equal(start.representativeMicrons, 850);
});

test("flow intent is converted within the official K-Ultra range", () => {
  const official = grinder({
    calibrationProfile: "manufacturer-resistance-start-zero",
    calibrationLabel: "제조사 저항 시작 영점",
  });
  const start = recipeGrindStart(
    recipe({ originalDescription: "굵은 분쇄", targetFlow: "fast" }),
    official,
  );

  assert.ok(start);
  assert.equal(start.source, "recipe-intent");
  assert.equal(start.value, 8.8);
  assert.ok(start.value >= 8 && start.value <= 9);
});

test("recipe-scoped personal grind wins and is clamped to the safe range", () => {
  const official = grinder({
    calibrationProfile: "manufacturer-resistance-start-zero",
    calibrationLabel: "제조사 저항 시작 영점",
  });
  const selectedRecipe = recipe({
    originalDescription: "중간 분쇄",
    targetFlow: "moderate",
  });
  const start = recipeGrindStart(selectedRecipe, official, "9.7");
  const result = applyRecipeGrindRecommendation(
    recommendation(),
    selectedRecipe,
    input(official, {
      personalRecipeGrindDisplayValue: "9.7",
      personalRecipeGrindStatus: "stable",
    }),
  );

  assert.ok(start);
  assert.equal(start.source, "personal");
  assert.equal(start.value, 9);
  assert.equal(result.grinder.displayValue, "9.0");
  assert.match(result.grinder.note, /안정 개인 레시피/);
  assert.match(result.grinder.note, /안전 추천 범위 8~9/);
});

test("unknown grinder bounds preserve the original phrase without forcing a number", () => {
  const unknown = grinder({
    model: "other",
    displayName: "사용자 그라인더",
    calibrationProfile: "unknown",
    calibrationLabel: "영점 미확인",
    calibrationStatus: "unknown",
    recommendationStatus: "disabled",
    displayUnit: "step",
    displayStep: 1,
    adjustmentDirection: "unknown",
  });
  const selectedRecipe = recipe({
    originalDescription: "중간보다 굵은 분쇄",
    targetFlow: "fast",
  });
  const result = applyRecipeGrindRecommendation(
    recommendation(),
    selectedRecipe,
    input(unknown),
  );

  assert.equal(recipeGrindStart(selectedRecipe, unknown), null);
  assert.equal(result.grinder.isNumeric, false);
  assert.equal(result.grinder.displayValue, "중간보다 굵은 분쇄");
  assert.equal(result.grinder.displayRange, "변환 없음");
  assert.match(result.grinder.note, /숫자를 강제하지 않습니다/);
});

test("the recommendation displays both original intent and converted start", () => {
  const selectedRecipe = recipe({
    originalDescription: "중간 분쇄",
    targetFlow: "moderate",
  });
  const result = applyRecipeGrindRecommendation(
    recommendation(),
    selectedRecipe,
    input(grinder()),
  );

  assert.equal(result.grinder.commonDescription, "중간 분쇄");
  assert.equal(result.grinder.displayValue, "7.2");
  assert.ok(
    result.reasons.some(
      (reason) =>
        reason.includes("원본 “중간 분쇄”") && reason.includes("7.2"),
    ),
  );
});
