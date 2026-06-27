import { beanBrewProfileStore } from "../storage/coffeeData.ts";
import type { BaristaRecipeMatchInput } from "@/lib/types/baristaRecipe";

export function rankingBoost(recipeId: string, input: BaristaRecipeMatchInput) {
  const profiles = beanBrewProfileStore.list().filter(
    (profile) =>
      profile.sourceRecipeId === recipeId &&
      profile.brewerType === input.brewerType &&
      (profile.drinkStyle ?? "hot") === input.drinkStyle,
  );
  if (profiles.some((profile) => profile.personalRecipe?.status === "stable")) {
    return 20;
  }
  if (
    profiles.some((profile) => profile.personalRecipe?.status === "provisional")
  ) {
    return 10;
  }
  return 0;
}
