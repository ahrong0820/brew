import type {
  BrewerType,
  DrinkStyle,
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
}

export interface BaristaRecipeMatchInput {
  brewerType: BrewerType;
  drinkStyle: DrinkStyle;
  roastLevel: RoastLevel;
  process: ProcessMethod;
  tasteGoal: TasteGoal;
  doseGrams: number;
  flavorNotes?: readonly string[];
}

export interface BaristaRecipeMatch {
  recipe: BaristaRecipe;
  score: number;
  reasons: string[];
}
