import type {
  Bean,
  BeanBrewProfile,
  BrewerType,
  BrewSession,
  BrewSessionStatus,
  DrinkStyle,
  GrinderAdjustmentDirection,
  GrinderCalibrationStatus,
  GrinderModel,
  GrinderProfile,
  GrinderRecommendationStatus,
  OriginCountry,
  OriginGroup,
  ProcessMethod,
  RecommendationConfidence,
  RoastLevel,
  TasteGoal,
  TastingResult,
  UserPreferences,
} from "@/lib/types/coffee";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return isString(value) && allowed.includes(value as T);
}

const originCountries: readonly OriginCountry[] = [
  "ethiopia",
  "kenya",
  "rwanda-burundi",
  "colombia",
  "central-america",
  "brazil",
  "asia",
  "blend",
  "other",
  "unknown",
];

const originGroups: readonly OriginGroup[] = [
  "east-africa",
  "latin-america",
  "brazil",
  "asia",
  "blend",
  "other",
  "unknown",
];

const roastLevels: readonly RoastLevel[] = [
  "light",
  "medium-light",
  "medium",
  "medium-dark",
  "dark",
  "unknown",
];

const processMethods: readonly ProcessMethod[] = [
  "washed",
  "natural",
  "honey",
  "fermented",
  "unknown",
];

const tasteGoals: readonly TasteGoal[] = [
  "sweet",
  "bright",
  "balanced",
  "body",
];

const brewerTypes: readonly BrewerType[] = [
  "v60",
  "clever",
  "switch",
  "other",
];

const drinkStyles: readonly DrinkStyle[] = ["hot", "iced"];

const grinderModels: readonly GrinderModel[] = [
  "1zpresso-k-ultra",
  "holzklotz-e80",
  "baratza-encore",
  "other",
];

const grinderCalibrationStatuses: readonly GrinderCalibrationStatus[] = [
  "user-calibrated",
  "factory",
  "unknown",
];

const grinderRecommendationStatuses: readonly GrinderRecommendationStatus[] = [
  "primary",
  "reference",
  "disabled",
];

const grinderAdjustmentDirections: readonly GrinderAdjustmentDirection[] = [
  "higher-is-coarser",
  "higher-is-finer",
  "unknown",
];

const recommendationConfidences: readonly RecommendationConfidence[] = [
  "high",
  "medium",
  "reference",
];

const brewSessionStatuses: readonly BrewSessionStatus[] = [
  "trial",
  "good",
  "current-best",
  "archived",
];

const tastingResults: readonly TastingResult[] = [
  "too-sour",
  "not-sweet-enough",
  "bitter-astringent",
  "too-weak",
  "too-strong",
  "aroma-muted",
  "good",
];

export function isBean(value: unknown): value is Bean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.name) &&
    isOptionalString(value.roaster) &&
    isOneOf(value.originCountry, originCountries) &&
    isOneOf(value.originGroup, originGroups) &&
    isOneOf(value.roastLevel, roastLevels) &&
    isOneOf(value.process, processMethods) &&
    isOptionalString(value.roastDate) &&
    isOptionalString(value.openedDate) &&
    isOptionalString(value.variety) &&
    (value.flavorNotes === undefined || isStringArray(value.flavorNotes)) &&
    isOptionalString(value.memo) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isGrinderProfile(value: unknown): value is GrinderProfile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isOneOf(value.model, grinderModels) &&
    isString(value.displayName) &&
    isString(value.calibrationProfile) &&
    isString(value.calibrationLabel) &&
    isOneOf(value.calibrationStatus, grinderCalibrationStatuses) &&
    isOneOf(value.recommendationStatus, grinderRecommendationStatuses) &&
    isOneOf(value.displayUnit, ["dial", "click", "step"] as const) &&
    isOneOf(value.adjustmentDirection, grinderAdjustmentDirections) &&
    (value.displayStep === undefined || isFiniteNumber(value.displayStep)) &&
    isFiniteNumber(value.personalOffset) &&
    isStringArray(value.notes) &&
    typeof value.isBuiltIn === "boolean" &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isRecommendationOffset(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.grind === undefined || isFiniteNumber(value.grind)) &&
    (value.temperature === undefined || isFiniteNumber(value.temperature)) &&
    (value.ratio === undefined || isFiniteNumber(value.ratio))
  );
}

export function isBeanBrewProfile(value: unknown): value is BeanBrewProfile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.beanId) &&
    isOneOf(value.brewerType, brewerTypes) &&
    isString(value.grinderProfileId) &&
    isOneOf(value.tasteGoal, tasteGoals) &&
    isOptionalString(value.currentBestSessionId) &&
    isOptionalString(value.latestSessionId) &&
    isRecommendationOffset(value.recommendationOffset) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isRecipeStepSnapshot(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
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

  return (
    isString(value.sourceTemplateId) &&
    isString(value.sourceTemplateName) &&
    isOneOf(value.brewerType, brewerTypes) &&
    isFiniteNumber(value.doseGrams) &&
    isFiniteNumber(value.waterGrams) &&
    isFiniteNumber(value.ratio) &&
    isFiniteNumber(value.temperatureCelsius) &&
    isFiniteNumber(value.grindLevel) &&
    isString(value.grinderDisplayValue) &&
    isFiniteNumber(value.totalTimeSeconds) &&
    isFiniteNumber(value.targetTimeMinSeconds) &&
    isFiniteNumber(value.targetTimeMaxSeconds) &&
    Array.isArray(value.steps) &&
    value.steps.every(isRecipeStepSnapshot)
  );
}

export function isBrewSession(value: unknown): value is BrewSession {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.beanId) &&
    isString(value.profileId) &&
    isOneOf(value.tasteGoal, tasteGoals) &&
    isOneOf(value.recommendationConfidence, recommendationConfidences) &&
    isRecipeSnapshot(value.recipeSnapshot) &&
    (value.actualTimeSeconds === undefined ||
      isFiniteNumber(value.actualTimeSeconds)) &&
    (value.tastingResult === undefined ||
      isOneOf(value.tastingResult, tastingResults)) &&
    isOptionalString(value.note) &&
    isOneOf(value.status, brewSessionStatuses) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isUserPreferences(value: unknown): value is UserPreferences {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isOneOf(value.defaultBrewer, brewerTypes) &&
    isFiniteNumber(value.defaultDoseGrams) &&
    isFiniteNumber(value.defaultWaterGrams) &&
    isOneOf(value.defaultDrinkStyle, drinkStyles) &&
    isString(value.defaultGrinderProfileId) &&
    isOneOf(value.defaultTasteGoal, tasteGoals) &&
    isString(value.updatedAt)
  );
}
