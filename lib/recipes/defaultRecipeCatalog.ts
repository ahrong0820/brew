import {
  defaultRecipeIdAliases,
  removedDefaultRecipeIds,
  removedDefaultRecipeNames,
} from "./defaultRecipeRegistry.ts";

export {
  defaultRecipeCatalogEntries,
  defaultRecipeCatalogVersion,
  defaultRecipeIdAliases,
  preferredDefaultRecipeOrder,
  removedDefaultRecipeIds,
  removedDefaultRecipeNames,
  requiredDefaultRecipeNames,
} from "./defaultRecipeRegistry.ts";

const removedDefaultRecipeIdSet = new Set<string>(removedDefaultRecipeIds);
const removedDefaultRecipeNameSet = new Set<string>(removedDefaultRecipeNames);
const aliasById: Readonly<Record<string, string>> = defaultRecipeIdAliases;

export function canonicalizeDefaultRecipeId(recipeId: string) {
  return aliasById[recipeId] ?? recipeId;
}

export function isRemovedDefaultRecipeId(recipeId: string) {
  return removedDefaultRecipeIdSet.has(recipeId);
}

export function isRemovedDefaultRecipeName(recipeName: string) {
  return removedDefaultRecipeNameSet.has(recipeName.trim());
}

export function migrateDefaultRecipeId(recipeId: string) {
  const canonicalRecipeId = canonicalizeDefaultRecipeId(recipeId);
  return isRemovedDefaultRecipeId(canonicalRecipeId) ? null : canonicalRecipeId;
}
