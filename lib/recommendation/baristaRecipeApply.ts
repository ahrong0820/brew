import { applyBaristaRecipeRecommendation as applyCurrent } from "./baristaRecipeRecommendation.ts";
import type { BrewRecommendation, RecommendationInput } from "@/lib/types/recommendation";

export function applyBaristaRecipeRecommendation(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
): BrewRecommendation {
  const result = applyCurrent(recommendation, input);
  if (result === recommendation) return recommendation;
  if (input.preferences.defaultBrewer !== "v60") return result;

  return {
    ...result,
    appliedRules: result.appliedRules?.map((rule) =>
      rule.id === "recipe.barista-catalog-match.v2"
        ? { ...rule, id: "recipe.hot-v60.barista-catalog-match.v1" }
        : rule,
    ),
  };
}
