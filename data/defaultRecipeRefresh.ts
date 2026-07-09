import { anstarDefaultRecipe } from "./anstarDefaultRecipe.ts";
import { clever111 } from "./clever111.ts";
import { jisVer2Default } from "./jisVer2Default.ts";
import { recipe484 } from "./recipe484.ts";
import { tetsuDefault } from "./tetsuDefault.ts";
import {
  preferredDefaultRecipeOrder,
  removedDefaultRecipeIds,
} from "../lib/recipes/defaultRecipeCatalog.ts";
import type { Recipe } from "../lib/types/defaultRecipe.ts";

const refreshedDefaultRecipes = [
  anstarDefaultRecipe,
  clever111,
  jisVer2Default,
  recipe484,
  tetsuDefault,
] satisfies readonly Recipe[];

export function buildDefaultRecipes<T extends Recipe>(legacyRecipes: readonly T[]) {
  const recipeById = new Map<string, Recipe>(
    legacyRecipes.map((recipe) => [recipe.id, recipe]),
  );
  for (const recipeId of removedDefaultRecipeIds) recipeById.delete(recipeId);
  for (const recipe of refreshedDefaultRecipes) {
    recipeById.set(recipe.id, recipe);
  }
  const preferredIds = new Set<string>(preferredDefaultRecipeOrder);
  return [
    ...preferredDefaultRecipeOrder.flatMap((recipeId) => {
      const recipe = recipeById.get(recipeId);
      return recipe ? [recipe] : [];
    }),
    ...Array.from(recipeById.values()).filter((recipe) => !preferredIds.has(recipe.id)),
  ];
}
