import { applyRatioAndWater as applyNormalizedRatioAndWater } from "@/lib/recommendation/normalization";
import type { BrewRecommendation } from "@/lib/types/recommendation";

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
} from "@/lib/recommendation/normalization";

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
