import type { TasteGoal } from "@/lib/types/coffee";
import type {
  BrewRecommendation,
  RecommendationStep,
} from "@/lib/types/recommendation";

const ratioByTaste: Record<TasteGoal, number> = {
  sweet: 15.5,
  bright: 16.5,
  balanced: 16,
  body: 15,
};

export function recommendedRatioForTaste(tasteGoal: TasteGoal) {
  return ratioByTaste[tasteGoal];
}

export function roundWaterGrams(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

export function recommendedWaterGrams(doseGrams: number, ratio: number) {
  return roundWaterGrams(doseGrams * ratio);
}

function scaleSteps(
  steps: RecommendationStep[],
  sourceWaterGrams: number,
  targetWaterGrams: number,
) {
  if (steps.length === 0 || sourceWaterGrams <= 0) {
    return steps;
  }

  const scale = targetWaterGrams / sourceWaterGrams;
  let previousTarget = 0;

  return steps.map((step, index) => {
    const isLast = index === steps.length - 1;
    const scaled = isLast
      ? targetWaterGrams
      : roundWaterGrams(step.targetWaterGrams * scale);
    const targetWater = Math.max(previousTarget, Math.min(targetWaterGrams, scaled));
    previousTarget = targetWater;

    return {
      ...step,
      targetWaterGrams: targetWater,
    };
  });
}

export function applyRatioAndWater(
  recommendation: BrewRecommendation,
  ratio: number,
): BrewRecommendation {
  const targetWaterGrams = recommendedWaterGrams(
    recommendation.doseGrams,
    ratio,
  );

  return {
    ...recommendation,
    ratio,
    waterGrams: targetWaterGrams,
    steps: scaleSteps(
      recommendation.steps,
      recommendation.waterGrams,
      targetWaterGrams,
    ),
  };
}
