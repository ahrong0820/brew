export const removedDefaultRecipeIds = [
  "signature-cone",
  "deepblue-v60",
  "jis-4666",
  "jis-clever-112",
] as const;

export const removedDefaultRecipeNames = [
  "시그니쳐 로스터스 콘 필터",
  "딥블루레이크 V60 HOT",
  "정인성 4666 오리지널",
  "정인성 클레버 1:12",
] as const;

export const defaultRecipeIdAliases = {
  "anstar-multiserve-20g-2024": "anstar-6888",
} as const;

export const preferredDefaultRecipeOrder = [
  "tetsu-46",
  "tetsu-neo-2026",
  "anstar-6888",
  "jis-ver2-hot",
  "jis-484-15g-2026",
  "yong-light",
  "switch-devil",
  "hoffmann-clever-water-first",
  "jis-clever-1-11",
] as const;

export const requiredDefaultRecipeNames = [
  "안스타 6888",
  "정인성 국룰 Ver 2.0 HOT",
  "정인성 484 15g (2026)",
  "정인성 클레버 1:11",
  "테츠 카스야 THE NEO BREW 2026",
] as const;

const removedDefaultRecipeIdSet = new Set<string>(removedDefaultRecipeIds);
const removedDefaultRecipeNameSet = new Set<string>(removedDefaultRecipeNames);
const aliasById: Record<string, string> = defaultRecipeIdAliases;

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
