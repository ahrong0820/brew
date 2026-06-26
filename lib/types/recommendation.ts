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

export type RecommendationRuleParameter =
  | "dose"
  | "water"
  | "ratio"
  | "temperature"
  | "grind"
  | "time"
  | "pour"
  | "confidence"
  | "personalization";

export type RecommendationEvidenceKind =
  | "published"
  | "competition"
  | "manufacturer"
  | "expert"
  | "heuristic"
  | "personal";

export interface RecommendationEvidenceReference {
  kind: RecommendationEvidenceKind;
  sourceId: string;
  note?: string;
}

export interface AppliedRecommendationRule {
  id: string;
  parameter: RecommendationRuleParameter;
  description: string;
  evidence: RecommendationEvidenceReference[];
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
  /** Traceable rule metadata. Legacy or externally constructed values may omit it. */
  appliedRules?: AppliedRecommendationRule[];
}
