import type {
  Bean,
  BeanBrewProfile,
  GrinderProfile,
  RecommendationConfidence,
  TasteGoal,
  UserPreferences,
} from "@/lib/types/coffee";

export interface RecommendationInput {
  bean: Bean;
  grinder: GrinderProfile;
  preferences: UserPreferences;
  tasteGoal: TasteGoal;
  recommendationOffset?: BeanBrewProfile["recommendationOffset"];
}

export interface RecommendationStep {
  label: string;
  startSeconds: number;
  targetWaterGrams: number;
  cue: string;
}

export interface GrinderRecommendation {
  displayValue: string;
  displayRange: string;
  commonDescription: string;
  calibrationLabel: string;
  isNumeric: boolean;
  note: string;
}

export interface BrewRecommendation {
  templateName: string;
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  temperatureCelsius: number;
  targetTimeMinSeconds: number;
  targetTimeMaxSeconds: number;
  grinder: GrinderRecommendation;
  steps: RecommendationStep[];
  reasons: string[];
  confidence: RecommendationConfidence;
  confidenceReason: string;
}
