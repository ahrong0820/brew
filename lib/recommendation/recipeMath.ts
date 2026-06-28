import { applyRatioAndWater as applyNormalizedRatioAndWater } from "./normalization.ts";
import type { BrewRecommendation } from "../types/recommendation.ts";

export {
  normalizeDoseGrams,
  normalizeRecommendation,
  normalizeRecommendationSteps,
  normalizeRatio,
  normalizeTemperatureCelsius,
  recommendedRatioForTaste,
  recommendedWaterGrams,
  recommendationLimits,
  roundToStep,
  roundWaterGrams,
} from "./normalization.ts";

export function applyRatioAndWater(
  recommendation: BrewRecommendation,
  ratio: number,
) {
  if (
    recommendation.sourceStatus === "verified" ||
    recommendation.sourceStatus === "partial"
  ) {
    return recommendation;
  }

  return applyNormalizedRatioAndWater(recommendation, ratio);
}
