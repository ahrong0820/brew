import { baristaRecipes as catalogRecipes } from "./baristaRecipes.ts";
import { sourceRecordForRecipe } from "./recipeSourceRegistry.ts";
import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export const baristaRecipes: readonly BaristaRecipe[] = catalogRecipes.map(
  (recipe) => {
    const source = sourceRecordForRecipe(recipe.id);
    if (!source) {
      return {
        ...recipe,
        sourceStatus: "reference" as const,
      };
    }

    return {
      ...recipe,
      sourceLabel: source.label,
      sourceStatus: source.check === "exact" ? "verified" : "reference",
    };
  },
);
