import type { BrewSession } from "@/lib/types/coffee";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || isString(value);
}

function isRecipeStep(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.label) &&
    isFiniteNumber(value.startSeconds) &&
    isFiniteNumber(value.endSeconds) &&
    isFiniteNumber(value.targetWaterGrams) &&
    isString(value.cue)
  );
}

function isRecipeSnapshot(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  const grinderModels = [
    "1zpresso-k-ultra",
    "holzklotz-e80",
    "baratza-encore",
    "other",
  ];

  return (
    isString(value.sourceTemplateId) &&
    isString(value.sourceTemplateName) &&
    ["v60", "clever", "switch", "other"].includes(String(value.brewerType)) &&
    isFiniteNumber(value.doseGrams) &&
    isFiniteNumber(value.waterGrams) &&
    isFiniteNumber(value.ratio) &&
    isFiniteNumber(value.temperatureCelsius) &&
    (value.grindLevel === undefined || isFiniteNumber(value.grindLevel)) &&
    isString(value.grinderDisplayValue) &&
    isOptionalString(value.grinderProfileId) &&
    (value.grinderModel === undefined ||
      grinderModels.includes(String(value.grinderModel))) &&
    isOptionalString(value.grinderCalibrationLabel) &&
    (value.estimatedRepresentativeMicrons === undefined ||
      isFiniteNumber(value.estimatedRepresentativeMicrons)) &&
    isFiniteNumber(value.totalTimeSeconds) &&
    isFiniteNumber(value.targetTimeMinSeconds) &&
    isFiniteNumber(value.targetTimeMaxSeconds) &&
    Array.isArray(value.steps) &&
    value.steps.every(isRecipeStep)
  );
}

export function isCompatibleBrewSession(value: unknown): value is BrewSession {
  if (!isRecord(value)) {
    return false;
  }

  const tasteGoals = ["sweet", "bright", "balanced", "body"];
  const confidences = ["high", "medium", "reference"];
  const statuses = ["trial", "good", "current-best", "archived"];
  const tastingResults = [
    "too-sour",
    "not-sweet-enough",
    "bitter-astringent",
    "too-weak",
    "too-strong",
    "aroma-muted",
    "good",
  ];

  return (
    isString(value.id) &&
    isString(value.beanId) &&
    isString(value.profileId) &&
    tasteGoals.includes(String(value.tasteGoal)) &&
    confidences.includes(String(value.recommendationConfidence)) &&
    isRecipeSnapshot(value.recipeSnapshot) &&
    (value.actualTimeSeconds === undefined ||
      isFiniteNumber(value.actualTimeSeconds)) &&
    (value.tastingResult === undefined ||
      tastingResults.includes(String(value.tastingResult))) &&
    isOptionalString(value.note) &&
    statuses.includes(String(value.status)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}
