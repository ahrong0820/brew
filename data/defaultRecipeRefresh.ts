import { anstarDefaultRecipe } from "./anstarDefaultRecipe.ts";
import { clever111 } from "./clever111.ts";
import { jisVer2Default } from "./jisVer2Default.ts";
import { recipe484 } from "./recipe484.ts";
import { tetsuDefault } from "./tetsuDefault.ts";

const refreshedDefaultRecipes = [
  anstarDefaultRecipe,
  clever111,
  jisVer2Default,
  recipe484,
  tetsuDefault,
];

const removedDefaultRecipeIds = new Set([
  "signature-cone",
  "deepblue-v60",
  "jis-4666",
  "jis-clever-112",
]);

const preferredDefaultRecipeOrder = [
  "tetsu-46",
  "tetsu-neo-2026",
  "anstar-6888",
  "jis-ver2-hot",
  "jis-484-15g-2026",
  "yong-light",
  "switch-devil",
  "hoffmann-clever-water-first",
  "jis-clever-1-11",
];

export function buildDefaultRecipes<T extends { id: string }>(legacyRecipes: readonly T[]) {
  const recipeById = new Map(legacyRecipes.map((recipe) => [recipe.id, recipe]));
  for (const recipeId of removedDefaultRecipeIds) recipeById.delete(recipeId);
  for (const recipe of refreshedDefaultRecipes) {
    recipeById.set(recipe.id, recipe as unknown as T);
  }
  const preferredIds = new Set(preferredDefaultRecipeOrder);
  return [
    ...preferredDefaultRecipeOrder.flatMap((recipeId) => {
      const recipe = recipeById.get(recipeId);
      return recipe ? [recipe] : [];
    }),
    ...Array.from(recipeById.values()).filter((recipe) => !preferredIds.has(recipe.id)),
  ];
}
