import { baristaRecipes as catalogRecipes } from "./baristaRecipes.ts";
import { sourceRecordForRecipe } from "./recipeSourceRegistry.ts";
import { canonicalizeDefaultRecipeId } from "../lib/recipes/defaultRecipeCatalog.ts";
import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export function auditBaristaRecipeSource(recipe: BaristaRecipe): BaristaRecipe {
  const canonicalRecipe: BaristaRecipe = {
    ...recipe,
    id: canonicalizeDefaultRecipeId(recipe.id),
  };
  const source = sourceRecordForRecipe(canonicalRecipe.id);
  if (!source) {
    return {
      ...canonicalRecipe,
      sourceStatus: "reference",
    };
  }

  return {
    ...canonicalRecipe,
    sourceLabel: source.label,
    sourceUrl: source.url || canonicalRecipe.sourceUrl,
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
