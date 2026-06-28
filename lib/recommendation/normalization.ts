// Coffee brewing quantities use grams; coffee bean amounts support 0.1g precision.
import { grinderSafeRange } from "./grindRecommendationV2.ts";
import type { GrinderProfile, TasteGoal } from "@/lib/types/coffee";
import type {
  BrewRecommendation,
  GrinderRecommendation,
  RecommendationStep,
} from "@/lib/types/recommendation";

export const recommendationLimits = {
  doseGrams: { min: 8, max: 40, step: 0.1 },
  waterGrams: { min: 0, max: 2_000, step: 5 },
  ratio: { min: 13, max: 18, step: 0.5 },
  temperatureCelsius: { min: 82, max: 96, step: 1 },
  timeSeconds: { min: 1, max: 1_800, step: 1 },
} as const;

const ratioByTaste: Record<TasteGoal, number> = {
  sweet: 15.5,
  bright: 16.5,
  balanced: 16,
  body: 15,
};

export interface NormalizeRecommendationOptions {
  deriveWaterFromRatio?: boolean;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundToStep(value: number, step: number) {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return value;
  }

  const decimals = (String(step).split(".")[1] ?? "").length;
  const precision = decimals > 0 ? 10 ** decimals : 1;
  return Math.round(Math.round(value / step) * step * precision) / precision;
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeDoseGrams(value: number, fallback = 15) {
  const { min, max, step } = recommendationLimits.doseGrams;
  return roundToStep(clampNumber(finiteOr(value, fallback), min, max), step);
}

export function recommendedRatioForTaste(tasteGoal: TasteGoal) {
  return ratioByTaste[tasteGoal];
}

export function normalizeRatio(value: number, fallback = 16) {
  const { min, max, step } = recommendationLimits.ratio;
  return roundToStep(clampNumber(finiteOr(value, fallback), min, max), step);
}

export function normalizeTemperatureCelsius(value: number, fallback = 91) {
  const { min, max, step } = recommendationLimits.temperatureCelsius;
  return roundToStep(clampNumber(finiteOr(value, fallback), min, max), step);
}

export function roundWaterGrams(value: number) {
  const { min, max, step } = recommendationLimits.waterGrams;
  return roundToStep(clampNumber(finiteOr(value, min), min, max), step);
}

export function recommendedWaterGrams(doseGrams: number, ratio: number) {
  return roundWaterGrams(normalizeDoseGrams(doseGrams) * normalizeRatio(ratio));
}

export function normalizeTimeSeconds(value: number, fallback: number) {
  const { min, max, step } = recommendationLimits.timeSeconds;
  return roundToStep(clampNumber(finiteOr(value, fallback), min, max), step);
}

export function grinderSettingBounds(grinder: GrinderProfile) {
  const safeRange = grinderSafeRange(grinder);
  if (safeRange) {
    return { min: safeRange.min, max: safeRange.max };
  }

  return {
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY,
  };
}

export function normalizeGrinderSetting(value: number, grinder: GrinderProfile) {
  const bounds = grinderSettingBounds(grinder);
  const step = grinder.displayStep ?? 1;
  return clampNumber(roundToStep(value, step), bounds.min, bounds.max);
}

export function grinderDisplayRange(
  value: number,
  width: number,
  grinder: GrinderProfile,
) {
  const bounds = grinderSettingBounds(grinder);
  const step = grinder.displayStep ?? 1;
  return {
    min: clampNumber(roundToStep(value - width, step), bounds.min, bounds.max),
    max: clampNumber(roundToStep(value + width, step), bounds.min, bounds.max),
  };
}

function grinderRangeWidth(grinder: GrinderProfile) {
  return grinderSafeRange(grinder)?.width ?? (grinder.displayStep ?? 1) * 2;
}

function formatGrinderSetting(value: number, grinder: GrinderProfile) {
  if (grinder.displayUnit === "dial") {
    const decimals = (String(grinder.displayStep ?? 0.1).split(".")[1] ?? "").length;
    return value.toFixed(Math.max(1, decimals));
  }

  return String(Math.round(value));
}

export function normalizeGrinderRecommendation(
  recommendation: GrinderRecommendation,
  grinder: GrinderProfile,
): GrinderRecommendation {
  if (!recommendation.isNumeric) {
    return recommendation;
  }

  const rawValue = Number(recommendation.displayValue);
  if (!Number.isFinite(rawValue)) {
    return recommendation;
  }

  const value = normalizeGrinderSetting(rawValue, grinder);
  const range = grinderDisplayRange(value, grinderRangeWidth(grinder), grinder);

  return {
    ...recommendation,
    displayValue: formatGrinderSetting(value, grinder),
    displayRange: `${formatGrinderSetting(range.min, grinder)}~${formatGrinderSetting(range.max, grinder)}`,
  };
}

export function normalizeRecommendationSteps(
  steps: RecommendationStep[],
  totalWaterGrams: number,
) {
  if (steps.length === 0) {
    return steps;
  }

  const water = roundWaterGrams(totalWaterGrams);
  let previousStart = 0;
  let previousTarget = 0;

  return steps.map((step, index) => {
    const startSeconds = Math.max(
      previousStart,
      Math.max(0, Math.round(finiteOr(step.startSeconds, previousStart))),
    );
    const requestedTarget =
      index === steps.length - 1
        ? water
        : roundWaterGrams(finiteOr(step.targetWaterGrams, previousTarget));
    const targetWaterGrams = Math.max(
      previousTarget,
      Math.min(water, requestedTarget),
    );

    previousStart = startSeconds;
    previousTarget = targetWaterGrams;

    return {
      ...step,
      startSeconds,
      targetWaterGrams,
    };
  });
}

export function normalizeRecommendation(
  recommendation: BrewRecommendation,
  options: NormalizeRecommendationOptions = {},
): BrewRecommendation {
  const doseGrams = normalizeDoseGrams(recommendation.doseGrams);
  const ratio = normalizeRatio(recommendation.ratio);
  const waterGrams = options.deriveWaterFromRatio
    ? recommendedWaterGrams(doseGrams, ratio)
    : roundWaterGrams(recommendation.waterGrams);
  const targetTimeMinSeconds = normalizeTimeSeconds(
    recommendation.targetTimeMinSeconds,
    150,
  );
  const targetTimeMaxSeconds = Math.max(
    targetTimeMinSeconds,
    normalizeTimeSeconds(recommendation.targetTimeMaxSeconds, 195),
  );

  return {
    ...recommendation,
    doseGrams,
    waterGrams,
    ratio,
    temperatureCelsius: normalizeTemperatureCelsius(
      recommendation.temperatureCelsius,
    ),
    targetTimeMinSeconds,
    targetTimeMaxSeconds,
    steps: normalizeRecommendationSteps(recommendation.steps, waterGrams),
  };
}

export function normalizeRecommendationForGrinder(
  recommendation: BrewRecommendation,
  grinder: GrinderProfile,
  options: NormalizeRecommendationOptions = {},
) {
  const normalized = normalizeRecommendation(recommendation, options);
  return {
    ...normalized,
    grinder: normalizeGrinderRecommendation(normalized.grinder, grinder),
  };
}

export function applyRatioAndWater(
  recommendation: BrewRecommendation,
  ratio: number,
) {
  return normalizeRecommendation(
    {
      ...recommendation,
      ratio,
    },
    { deriveWaterFromRatio: true },
  );
}
