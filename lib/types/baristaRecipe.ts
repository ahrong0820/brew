import type {
  BrewerType,
  DrinkStyle,
  OriginCountry,
  OriginGroup,
  ProcessMethod,
  RoastLevel,
  TasteGoal,
} from "@/lib/types/coffee";

export type BaristaRecipeSourceStatus = "verified" | "reference";

export type BaristaRecipeDifficulty = "easy" | "medium" | "advanced";

export type RecipeGrindFlow = "fast" | "moderate" | "slow";

export interface BaristaRecipeGrindIntent {
  originalDescription: string;
  targetFlow: RecipeGrindFlow;
  representativeMicrons?: {
    min: number;
    max: number;
  };
}

export interface BaristaRecipeStep {
  label: string;
  startSeconds: number;
  targetWaterGrams: number;
  cue: string;
}

export interface BaristaRecipe {
  id: string;
  name: string;
  author: string;
  sourceLabel: string;
  sourceUrl?: string;
  sourceStatus: BaristaRecipeSourceStatus;
  brewerType: BrewerType;
  drinkStyle: DrinkStyle;
  doseGrams: number;
  supportedDoseGrams: {
    min: number;
    max: number;
  };
  waterGrams: number;
  ratio: number;
  temperatureCelsius?: number;
  targetTimeMinSeconds: number;
  targetTimeMaxSeconds: number;
  tasteProfile: Readonly<Record<TasteGoal, number>>;
  suitableRoasts: readonly RoastLevel[];
  suitableProcesses: readonly ProcessMethod[];
  flavorKeywords: readonly string[];
  grindIntent: BaristaRecipeGrindIntent;
  difficulty: BaristaRecipeDifficulty;
  steps: readonly BaristaRecipeStep[];
}

export interface BaristaRecipeMatchInput {
  brewerType: BrewerType;
  drinkStyle: DrinkStyle;
  roastLevel: RoastLevel;
  process: ProcessMethod;
  tasteGoal: TasteGoal;
  doseGrams: number;
  flavorNotes?: readonly string[];
  originCountry?: OriginCountry;
  originGroup?: OriginGroup;
  originRegions?: readonly string[];
  variety?: string;
  /** Optional deterministic history fixture; browser recommendations fall back to Local Storage. */
  personalRecipeStatuses?: Readonly<
    Record<string, "provisional" | "stable">
  >;
}

export interface BaristaRecipeMatch {
  recipe: BaristaRecipe;
  score: number;
  reasons: string[];
}
