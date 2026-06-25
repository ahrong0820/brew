import { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";
import { beanBrewProfileStore } from "@/lib/storage/coffeeData";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export function createRecommendation(
  input: RecommendationInput,
): BrewRecommendation {
  const profile = beanBrewProfileStore.list().find(
    (candidate) =>
      candidate.beanId === input.bean.id &&
      candidate.brewerType === input.preferences.defaultBrewer &&
      candidate.grinderProfileId === input.grinder.id &&
      candidate.tasteGoal === input.tasteGoal,
  );

  return createPersonalizedRecommendation({
    ...input,
    recommendationOffset:
      input.recommendationOffset ?? profile?.recommendationOffset,
  });
}
