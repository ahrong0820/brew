import type { RecommendationTraceSnapshot } from "@/lib/types/recommendationTrace";

export type OriginCountry =
  | "ethiopia"
  | "kenya"
  | "rwanda-burundi"
  | "colombia"
  | "central-america"
  | "brazil"
  | "asia"
  | "blend"
  | "other"
  | "unknown";

export type OriginGroup =
  | "east-africa"
  | "latin-america"
  | "brazil"
  | "asia"
  | "blend"
  | "other"
  | "unknown";

export type RoastLevel =
  | "light"
  | "medium-light"
  | "medium"
  | "medium-dark"
  | "dark"
  | "unknown";

export type ProcessMethod =
  | "washed"
  | "natural"
  | "honey"
  | "fermented"
  | "unknown";

export type TasteGoal = "sweet" | "bright" | "balanced" | "body";

export type BrewerType = "v60" | "clever" | "switch" | "other";

export type DrinkStyle = "hot" | "iced";

export type GrinderModel =
  | "1zpresso-k-ultra"
  | "holzklotz-e80"
  | "baratza-encore"
  | "other";

export type GrinderCalibrationStatus =
  | "user-calibrated"
  | "factory"
  | "unknown";

export type GrinderRecommendationStatus =
  | "primary"
  | "reference"
  | "disabled";

export type GrinderAdjustmentDirection =
  | "higher-is-coarser"
  | "higher-is-finer"
  | "unknown";

export type RecommendationConfidence = "high" | "medium" | "reference";

export type BrewSessionStatus =
  | "trial"
  | "good"
  | "current-best"
  | "archived";

export type BrewPaceAssessment = "fast" | "in-range" | "slow";

export type TastingResult =
  | "too-sour"
  | "not-sweet-enough"
  | "bitter-astringent"
  | "too-weak"
  | "too-strong"
  | "aroma-muted"
  | "good";

export type BrewAdjustmentVariable =
  | "grind"
  | "temperature"
  | "ratio"
  | "none";

export type BrewAdjustmentAction =
  | "hold"
  | "finer"
  | "coarser"
  | "hotter"
  | "cooler"
  | "less-water"
  | "more-water";

export type BrewAdjustmentOutcome = "improved" | "same" | "worse";

export interface BrewAdjustmentTrial {
  id: string;
  sourceSessionId: string;
  resultSessionId?: string;
  variable: Exclude<BrewAdjustmentVariable, "none">;
  action: Exclude<BrewAdjustmentAction, "hold">;
  delta: number;
  currentValue: string;
  nextValue: string;
  outcome?: BrewAdjustmentOutcome;
  appliedAt: string;
  evaluatedAt?: string;
}

export type PersonalRecipeStatus = "provisional" | "stable";

export interface PersonalRecipeVersion {
  version: number;
  sessionId: string;
  createdAt: string;
  successfulBrewCount: number;
  grindDisplayValue: string;
  temperatureCelsius: number;
  ratio: number;
}

export interface PersonalRecipeState {
  status: PersonalRecipeStatus;
  successfulBrewCount: number;
  currentSessionId: string;
  version: number;
  versions: PersonalRecipeVersion[];
  updatedAt: string;
}

export interface Bean {
  id: string;
  name: string;
  roaster?: string;
  originCountry: OriginCountry;
  originGroup: OriginGroup;
  originRegions?: readonly string[];
  roastLevel: RoastLevel;
  process: ProcessMethod;
  roastDate?: string;
  openedDate?: string;
  variety?: string;
  flavorNotes?: string[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrinderMicronReferencePoint {
  step: number;
  microns: number;
}

export interface GrinderMicronReference {
  source: "manufacturer" | "community" | "reference" | "user";
  sourceLabel: string;
  metricLabel?: string;
  typicalToleranceMicrons?: number;
  points: GrinderMicronReferencePoint[];
  linearFit?: {
    slope: number;
    intercept: number;
  };
}

export interface GrinderProfile {
  id: string;
  model: GrinderModel;
  displayName: string;
  calibrationProfile: string;
  calibrationLabel: string;
  calibrationStatus: GrinderCalibrationStatus;
  recommendationStatus: GrinderRecommendationStatus;
  displayUnit: "dial" | "click" | "step";
  adjustmentDirection: GrinderAdjustmentDirection;
  displayStep?: number;
  personalOffset: number;
  micronReference?: GrinderMicronReference;
  notes: string[];
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  defaultBrewer: BrewerType;
  defaultDoseGrams: number;
  defaultWaterGrams: number;
  defaultDrinkStyle: DrinkStyle;
  defaultGrinderProfileId: string;
  defaultTasteGoal: TasteGoal;
  updatedAt: string;
}

export interface RecipeStepSnapshot {
  label: string;
  startSeconds: number;
  endSeconds: number;
  targetWaterGrams: number;
  cue: string;
}

export interface RecipeSnapshot {
  sourceTemplateId: string;
  sourceTemplateName: string;
  brewerType: BrewerType;
  /** Legacy snapshots without this field are treated as hot. */
  drinkStyle?: DrinkStyle;
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  temperatureCelsius: number;
  grindLevel?: number;
  grinderDisplayValue: string;
  grinderProfileId?: string;
  grinderModel?: GrinderModel;
  grinderCalibrationLabel?: string;
  estimatedRepresentativeMicrons?: number;
  totalTimeSeconds: number;
  targetTimeMinSeconds: number;
  targetTimeMaxSeconds: number;
  /** Legacy snapshots may omit trace metadata. */
  recommendationTrace?: RecommendationTraceSnapshot;
  steps: RecipeStepSnapshot[];
}

export interface BeanBrewProfile {
  id: string;
  beanId: string;
  brewerType: BrewerType;
  /** Legacy profiles without this field are treated as hot. */
  drinkStyle?: DrinkStyle;
  grinderProfileId: string;
  tasteGoal: TasteGoal;
  /** Selected barista recipe. Legacy profiles remain in a separate default scope. */
  sourceRecipeId?: string;
  currentBestSessionId?: string;
  latestSessionId?: string;
  recommendationOffset: {
    grind?: number;
    temperature?: number;
    ratio?: number;
  };
  /** Bounded history of applied one-variable dial-in trials. */
  adjustmentHistory?: BrewAdjustmentTrial[];
  /** Trial that must be evaluated by the next completed brew. */
  pendingAdjustmentId?: string;
  /** Recipe-scoped personal derivative created from successful brews. */
  personalRecipe?: PersonalRecipeState;
  createdAt: string;
  updatedAt: string;
}

export interface BrewSession {
  id: string;
  beanId: string;
  profileId: string;
  /** Legacy sessions without this field are treated as hot. */
  drinkStyle?: DrinkStyle;
  tasteGoal: TasteGoal;
  recommendationConfidence: RecommendationConfidence;
  recipeSnapshot: RecipeSnapshot;
  /** Timer value is retained for the record but is not used for dial-in diagnosis. */
  actualTimeSeconds?: number;
  /** User judgement of whether the drawdown felt fast, on target, or slow. */
  brewPaceAssessment?: BrewPaceAssessment;
  tastingResult?: TastingResult;
  /** Adjustment applied to this brew, if any. */
  appliedAdjustmentId?: string;
  /** Session used as the comparison baseline for the applied adjustment. */
  comparedToSessionId?: string;
  /** User judgement of the applied adjustment versus the comparison brew. */
  adjustmentOutcome?: BrewAdjustmentOutcome;
  note?: string;
  status: BrewSessionStatus;
  createdAt: string;
  updatedAt: string;
}
