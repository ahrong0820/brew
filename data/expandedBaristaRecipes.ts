import { additionalBaristaRecipes } from "./additionalBaristaRecipes.ts";
import { baristaRecipes as auditedBaristaRecipes } from "./auditedBaristaRecipes.ts";
import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export const baristaRecipes: readonly BaristaRecipe[] = [
  ...auditedBaristaRecipes,
  ...additionalBaristaRecipes,
];
