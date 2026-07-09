import {
  canonicalizeDefaultRecipeId,
  isRemovedDefaultRecipeId,
  isRemovedDefaultRecipeName,
  migrateDefaultRecipeId,
} from "./defaultRecipeCatalog.ts";

const favoriteRecipeStorageKey = "coffee-recipe-favorites";
const customRecipesStorageKey = "coffee-custom-recipes";
const activeBrewSessionStorageKey = "brew.activeRecommendationSession.v1";
const beanBrewProfilesStorageKey = "brew.beanBrewProfiles.v1";
const brewSessionsStorageKey = "brew.brewSessions.v1";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RecipeStorageMigrationScope {
  localStorage?: StorageLike;
  sessionStorage?: StorageLike;
}

export interface RecipeStorageMigrationReport {
  changed: boolean;
  migratedFavoriteIds: number;
  removedFavoriteIds: number;
  migratedCustomRecipeEntries: number;
  removedCustomRecipeEntries: number;
  migratedProfileRecipeIds: number;
  clearedProfileRecipeIds: number;
  migratedSessionRecipeIds: number;
  clearedActiveSession: boolean;
  migratedActiveSessionRecipeId: boolean;
}

function emptyReport(): RecipeStorageMigrationReport {
  return {
    changed: false,
    migratedFavoriteIds: 0,
    removedFavoriteIds: 0,
    migratedCustomRecipeEntries: 0,
    removedCustomRecipeEntries: 0,
    migratedProfileRecipeIds: 0,
    clearedProfileRecipeIds: 0,
    migratedSessionRecipeIds: 0,
    clearedActiveSession: false,
    migratedActiveSessionRecipeId: false,
  };
}

function browserScope(): RecipeStorageMigrationScope | null {
  if (typeof window === "undefined") {
    return null;
  }

  return {
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
  };
}

function readJson(storage: StorageLike, key: string): unknown {
  const raw = storage.getItem(key);
  if (!raw) return null;

  return JSON.parse(raw) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function writeJson(storage: StorageLike, key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value));
}

function migrateFavoriteIds(storage: StorageLike, report: RecipeStorageMigrationReport) {
  const parsed = readJson(storage, favoriteRecipeStorageKey);
  if (!Array.isArray(parsed)) return;

  const nextIds: string[] = [];
  for (const value of parsed) {
    if (typeof value !== "string") {
      report.removedFavoriteIds += 1;
      continue;
    }

    const migratedId = migrateDefaultRecipeId(value);
    if (!migratedId) {
      report.removedFavoriteIds += 1;
      continue;
    }

    if (migratedId !== value) {
      report.migratedFavoriteIds += 1;
    }

    if (!nextIds.includes(migratedId)) {
      nextIds.push(migratedId);
    }
  }

  if (!sameJson(parsed, nextIds)) {
    writeJson(storage, favoriteRecipeStorageKey, nextIds);
    report.changed = true;
  }
}

function migrateCustomRecipes(storage: StorageLike, report: RecipeStorageMigrationReport) {
  const parsed = readJson(storage, customRecipesStorageKey);
  if (!Array.isArray(parsed)) return;

  const nextRecipes = parsed.filter((value) => {
    if (!isRecord(value) || typeof value.id !== "string") {
      report.removedCustomRecipeEntries += 1;
      return false;
    }

    if (value.id.startsWith("custom-")) {
      return true;
    }

    report.removedCustomRecipeEntries += 1;
    return false;
  });

  if (!sameJson(parsed, nextRecipes)) {
    writeJson(storage, customRecipesStorageKey, nextRecipes);
    report.changed = true;
  }
}

function migrateBeanBrewProfiles(storage: StorageLike, report: RecipeStorageMigrationReport) {
  const parsed = readJson(storage, beanBrewProfilesStorageKey);
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) {
    return;
  }

  const nextItems = parsed.items.map((value) => {
    if (!isRecord(value) || typeof value.sourceRecipeId !== "string") {
      return value;
    }

    const migratedId = migrateDefaultRecipeId(value.sourceRecipeId);
    if (!migratedId) {
      const rest = { ...value };
      delete rest.sourceRecipeId;
      report.clearedProfileRecipeIds += 1;
      return rest;
    }

    if (migratedId !== value.sourceRecipeId) {
      report.migratedProfileRecipeIds += 1;
      return { ...value, sourceRecipeId: migratedId };
    }

    return value;
  });

  const nextValue = { ...parsed, items: nextItems };
  if (!sameJson(parsed, nextValue)) {
    writeJson(storage, beanBrewProfilesStorageKey, nextValue);
    report.changed = true;
  }
}

function migrateBrewSessions(storage: StorageLike, report: RecipeStorageMigrationReport) {
  const parsed = readJson(storage, brewSessionsStorageKey);
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) {
    return;
  }

  const nextItems = parsed.items.map((value) => {
    if (!isRecord(value) || !isRecord(value.recipeSnapshot)) {
      return value;
    }

    const sourceTemplateId = value.recipeSnapshot.sourceTemplateId;
    if (typeof sourceTemplateId !== "string") {
      return value;
    }

    const canonicalId = canonicalizeDefaultRecipeId(sourceTemplateId);
    if (canonicalId === sourceTemplateId || isRemovedDefaultRecipeId(canonicalId)) {
      return value;
    }

    report.migratedSessionRecipeIds += 1;
    return {
      ...value,
      recipeSnapshot: {
        ...value.recipeSnapshot,
        sourceTemplateId: canonicalId,
      },
    };
  });

  const nextValue = { ...parsed, items: nextItems };
  if (!sameJson(parsed, nextValue)) {
    writeJson(storage, brewSessionsStorageKey, nextValue);
    report.changed = true;
  }
}

function migrateActiveSession(
  storage: StorageLike,
  report: RecipeStorageMigrationReport,
) {
  const parsed = readJson(storage, activeBrewSessionStorageKey);
  if (!isRecord(parsed)) return;

  if (typeof parsed.recipeName === "string" && isRemovedDefaultRecipeName(parsed.recipeName)) {
    storage.removeItem(activeBrewSessionStorageKey);
    report.clearedActiveSession = true;
    report.changed = true;
    return;
  }

  const recipe = parsed.recipe;
  if (!isRecord(recipe) || typeof recipe.id !== "string") return;

  const migratedId = migrateDefaultRecipeId(recipe.id);
  if (!migratedId) {
    storage.removeItem(activeBrewSessionStorageKey);
    report.clearedActiveSession = true;
    report.changed = true;
    return;
  }

  if (migratedId !== recipe.id) {
    writeJson(storage, activeBrewSessionStorageKey, {
      ...parsed,
      recipe: {
        ...recipe,
        id: migratedId,
      },
    });
    report.migratedActiveSessionRecipeId = true;
    report.changed = true;
  }
}

export function migrateDefaultRecipeClientStorage(
  scope: RecipeStorageMigrationScope | null = browserScope(),
): RecipeStorageMigrationReport {
  const report = emptyReport();
  if (!scope) return report;

  try {
    if (scope.localStorage) {
      migrateFavoriteIds(scope.localStorage, report);
      migrateCustomRecipes(scope.localStorage, report);
      migrateBeanBrewProfiles(scope.localStorage, report);
      migrateBrewSessions(scope.localStorage, report);
    }
    if (scope.sessionStorage) {
      migrateActiveSession(scope.sessionStorage, report);
    }
  } catch {
    return report;
  }

  return report;
}
