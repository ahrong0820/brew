import { defaultRecipes } from "./defaultRecipes.ts";
import { isRemovedDefaultRecipeId } from "../lib/recipes/defaultRecipeCatalog.ts";
import type { Recipe } from "../lib/types/defaultRecipe.ts";

/**
 * Compatibility adapter for older callers that still provide a legacy list.
 * The canonical nine recipes always come from defaultRecipes; only unrelated,
 * non-removed extensions are appended.
 */
export function buildDefaultRecipes<T extends { id: string }>(
  legacyRecipes: readonly T[],
): Recipe[] {
  const canonicalIds = new Set(defaultRecipes.map((recipe) => recipe.id));
  const extensions = legacyRecipes.filter(
    (recipe) =>
      !canonicalIds.has(recipe.id) && !isRemovedDefaultRecipeId(recipe.id),
  );

  return [...defaultRecipes, ...(extensions as unknown as Recipe[])];
}
