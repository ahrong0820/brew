import { baristaRecipes as catalogRecipes } from "./baristaRecipes.ts";
import { sourceRecordForRecipe } from "./recipeSourceRegistry.ts";
import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export function auditBaristaRecipeSource(recipe: BaristaRecipe): BaristaRecipe {
  const source = sourceRecordForRecipe(recipe.id);
  if (!source) {
    return {
      ...recipe,
      sourceStatus: "reference",
    };
  }

  return {
    ...recipe,
    sourceLabel: source.label,
    sourceUrl: source.url || recipe.sourceUrl,
    sourceStatus:
      source.check === "exact"
        ? "verified"
        : source.check === "partial"
          ? "partial"
          : "reference",
  };
}

export const baristaRecipes: readonly BaristaRecipe[] = catalogRecipes.map(
  auditBaristaRecipeSource,
);
