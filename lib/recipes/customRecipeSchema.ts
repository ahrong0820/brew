import {
  removeStorageItem,
  writeJsonStorage,
} from "../storage/browserJsonStorage.ts";
import type {
  BrewStep,
  Recipe,
  WaterAmount,
} from "../types/defaultRecipe.ts";

export const customRecipesStorageKey = "coffee-custom-recipes";
export const customRecipeQuarantineStorageKey =
  "coffee-custom-recipes-quarantine.v1";

export interface CustomRecipeRejection {
  value: unknown;
  reason: string;
}

export interface CustomRecipeParseResult {
  recipes: Recipe[];
  rejected: CustomRecipeRejection[];
}

export interface CustomRecipeStorageRepairResult extends CustomRecipeParseResult {
  changed: boolean;
  malformedJson: boolean;
}

export interface CustomRecipeStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isWaterAmount(value: unknown): value is WaterAmount {
  if (isFiniteNumber(value)) return value >= 0;
  return (
    isRecord(value) &&
    isFiniteNumber(value.min) &&
    isFiniteNumber(value.max) &&
    value.min >= 0 &&
    value.max >= value.min
  );
}

function validateStep(value: unknown, index: number, previous: BrewStep | null) {
  if (!isRecord(value)) return `steps[${index}] is not an object`;
  if (!isNonEmptyString(value.label)) return `steps[${index}].label is invalid`;
  if (!isFiniteNumber(value.start) || value.start < 0) {
    return `steps[${index}].start is invalid`;
  }
  if (!isFiniteNumber(value.end) || value.end < value.start) {
    return `steps[${index}].end is invalid`;
  }
  if (!isFiniteNumber(value.targetWater) || value.targetWater < 0) {
    return `steps[${index}].targetWater is invalid`;
  }
  if (!isNonEmptyString(value.cue)) return `steps[${index}].cue is invalid`;
  if (value.displayTargetWater !== undefined && !isWaterAmount(value.displayTargetWater)) {
    return `steps[${index}].displayTargetWater is invalid`;
  }
  if (value.displayStepWater !== undefined && !isWaterAmount(value.displayStepWater)) {
    return `steps[${index}].displayStepWater is invalid`;
  }
  if (previous && value.start < previous.start) {
    return `steps[${index}].start is not monotonic`;
  }
  if (previous && value.targetWater < previous.targetWater) {
    return `steps[${index}].targetWater decreases`;
  }
  return null;
}

export function parseCustomRecipe(value: unknown):
  | { recipe: Recipe; reason?: never }
  | { recipe?: never; reason: string } {
  if (!isRecord(value)) return { reason: "recipe is not an object" };
  if (!isNonEmptyString(value.id) || !value.id.startsWith("custom-")) {
    return { reason: "id must start with custom-" };
  }

  const stringFields = ["name", "origin", "method", "profile", "ratio", "temp", "grind"];
  for (const field of stringFields) {
    if (!isNonEmptyString(value[field])) return { reason: `${field} is invalid` };
  }

  if (!isFiniteNumber(value.dose) || value.dose <= 0) return { reason: "dose must be positive" };
  if (!isFiniteNumber(value.water) || value.water < 0) return { reason: "water is invalid" };
  if (!isFiniteNumber(value.totalTime) || value.totalTime <= 0) {
    return { reason: "totalTime must be positive" };
  }
  if (!isStringArray(value.tags)) return { reason: "tags must be a string array" };
  if (!isStringArray(value.notes)) return { reason: "notes must be a string array" };
  if (value.brewWater !== undefined && (!isFiniteNumber(value.brewWater) || value.brewWater < 0)) {
    return { reason: "brewWater is invalid" };
  }
  if (value.bypassWater !== undefined && !isWaterAmount(value.bypassWater)) {
    return { reason: "bypassWater is invalid" };
  }
  if (value.finalWater !== undefined && !isWaterAmount(value.finalWater)) {
    return { reason: "finalWater is invalid" };
  }
  if (!Array.isArray(value.steps) || value.steps.length === 0) {
    return { reason: "steps must contain at least one step" };
  }

  let previous: BrewStep | null = null;
  for (let index = 0; index < value.steps.length; index += 1) {
    const reason = validateStep(value.steps[index], index, previous);
    if (reason) return { reason };
    previous = value.steps[index] as BrewStep;
  }

  const lastStep = previous;
  if (!lastStep || lastStep.end !== value.totalTime) {
    return { reason: "totalTime must equal the final step end" };
  }
  if (lastStep.targetWater !== value.water && value.brewWater === undefined) {
    return { reason: "water must equal the final step targetWater" };
  }
  if (value.brewWater !== undefined && lastStep.targetWater !== value.brewWater) {
    return { reason: "brewWater must equal the final step targetWater" };
  }

  return { recipe: value as unknown as Recipe };
}

export function parseStoredCustomRecipes(value: unknown): CustomRecipeParseResult {
  if (!Array.isArray(value)) {
    return {
      recipes: [],
      rejected: value === null ? [] : [{ value, reason: "stored value is not an array" }],
    };
  }

  const recipes: Recipe[] = [];
  const rejected: CustomRecipeRejection[] = [];
  for (const item of value) {
    const result = parseCustomRecipe(item);
    if (result.recipe) recipes.push(result.recipe);
    else rejected.push({ value: item, reason: result.reason });
  }
  return { recipes, rejected };
}

export function quarantineRejectedCustomRecipes(
  storage: CustomRecipeStorageLike,
  rejected: CustomRecipeRejection[],
) {
  if (rejected.length === 0) return;

  let previous: unknown[] = [];
  try {
    const raw = storage.getItem(customRecipeQuarantineStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) previous = parsed;
  } catch {
    previous = [];
  }

  const quarantinedAt = new Date().toISOString();
  const next = [
    ...rejected.map((entry) => ({ quarantinedAt, ...entry })),
    ...previous,
  ].slice(0, 50);
  return writeJsonStorage(storage, customRecipeQuarantineStorageKey, next).ok;
}

export function repairStoredCustomRecipeStorage(
  storage: CustomRecipeStorageLike,
): CustomRecipeStorageRepairResult {
  let raw: string | null;
  try {
    raw = storage.getItem(customRecipesStorageKey);
  } catch {
    return { recipes: [], rejected: [], changed: false, malformedJson: false };
  }
  if (!raw) return { recipes: [], rejected: [], changed: false, malformedJson: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    quarantineRejectedCustomRecipes(storage, [
      { value: raw, reason: "stored JSON is malformed" },
    ]);
    const removed = removeStorageItem(storage, customRecipesStorageKey);
    return { recipes: [], rejected: [], changed: removed.ok, malformedJson: true };
  }

  const result = parseStoredCustomRecipes(parsed);
  const changed = result.rejected.length > 0 || !Array.isArray(parsed);
  if (result.rejected.length > 0) quarantineRejectedCustomRecipes(storage, result.rejected);
  if (changed) writeJsonStorage(storage, customRecipesStorageKey, result.recipes);
  return { ...result, changed, malformedJson: false };
}
