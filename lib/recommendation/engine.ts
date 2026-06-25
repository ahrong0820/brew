import { applyHistoryConfidence } from "@/lib/recommendation/historyConfidence";
import { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";
import {
  applyRatioAndWater,
  recommendedRatioForTaste,
  recommendedWaterGrams,
} from "@/lib/recommendation/recipeMath";
import { beanBrewProfileStore } from "@/lib/storage/coffeeData";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export function createRecommendation(
  input: RecommendationInput,
): BrewRecommendation {
  const baseRatio = recommendedRatioForTaste(input.tasteGoal);
  const normalizedInput: RecommendationInput = {
    ...input,
    preferences: {
      ...input.preferences,
      defaultWaterGrams: recommendedWaterGrams(
        input.preferences.defaultDoseGrams,
        baseRatio,
      ),
    },
  };
  const profile = beanBrewProfileStore.list().find(
    (candidate) =>
      candidate.beanId === normalizedInput.bean.id &&
      candidate.brewerType === normalizedInput.preferences.defaultBrewer &&
      candidate.grinderProfileId === normalizedInput.grinder.id &&
      candidate.tasteGoal === normalizedInput.tasteGoal,
  );
  const personalized = createPersonalizedRecommendation({
    ...normalizedInput,
    recommendationOffset:
      normalizedInput.recommendationOffset ?? profile?.recommendationOffset,
  });
  const normalizedRecommendation = applyRatioAndWater(
    personalized,
    personalized.ratio,
  );

  return applyHistoryConfidence(normalizedRecommendation, profile);
}
