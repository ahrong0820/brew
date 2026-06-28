import { additionalBaristaRecipes } from "./additionalBaristaRecipes.ts";
import {
  auditBaristaRecipeSource,
  baristaRecipes as auditedBaristaRecipes,
} from "./auditedBaristaRecipes.ts";
import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export const baristaRecipes: readonly BaristaRecipe[] = [
  ...auditedBaristaRecipes,
  ...additionalBaristaRecipes.map(auditBaristaRecipeSource),
];
