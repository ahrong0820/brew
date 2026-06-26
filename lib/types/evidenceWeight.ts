import type {
  EvidenceAssessment,
  EvidenceContext,
  EvidenceObservation,
  EvidenceReviewStatus,
  EvidenceSource,
  EvidenceSourceType,
} from "@/lib/types/evidence";

export type ConditionMatchState =
  | "match"
  | "partial"
  | "unknown"
  | "mismatch"
  | "not-applicable";

export type ConditionMatchDimension =
  | "brewer"
  | "drinkStyle"
  | "origin"
  | "roastLevel"
  | "process"
  | "doseRatio"
  | "grinderBurr"
  | "filter"
  | "water"
  | "tasteGoal";

export interface EvidenceWeightPolicy {
  version: string;
  sourceTypeWeights: Readonly<Record<EvidenceSourceType, number>>;
  methodologyWeights: Readonly<
    Record<EvidenceAssessment["methodologicalStrength"], number>
  >;
  directnessWeights: Readonly<Record<EvidenceAssessment["directness"], number>>;
  reproducibilityWeights: Readonly<
    Record<EvidenceAssessment["reproducibility"], number>
  >;
  reviewStatusWeights: Readonly<Record<EvidenceReviewStatus, number>>;
  extractionConfidenceWeights: Readonly<
    Record<EvidenceAssessment["extractionConfidence"], number>
  >;
  reviewMetadataWeight: {
    complete: number;
    incomplete: number;
  };
  personalSuccessWeight: {
    single: number;
    repeated: number;
  };
  conditionDimensionWeights: Readonly<
    Record<ConditionMatchDimension, number>
  >;
  conditionStateWeights: Readonly<Record<ConditionMatchState, number>>;
  independence: {
    independent: number;
    sameSourceAdditional: number;
    sameLineageAdditional: number;
  };
}

export interface ConditionMatchResult {
  score: number;
  dimensions: Readonly<
    Record<ConditionMatchDimension, ConditionMatchState>
  >;
}

export interface EvidenceScoreRequest {
  source: EvidenceSource;
  observation: EvidenceObservation;
  targetContext: EvidenceContext;
  personalSuccessCount?: number;
  independenceMultiplier?: number;
}

export interface EvidenceScoreBreakdown {
  sourceId: string;
  observationId: string;
  sourceTypeWeight: number;
  methodologyWeight: number;
  directnessWeight: number;
  conditionMatch: ConditionMatchResult;
  independenceWeight: number;
  reproducibilityWeight: number;
  reviewTrustWeight: number;
  personalSuccessWeight: number;
  finalScore: number;
}

export interface WeightedEvidenceEntry extends EvidenceScoreBreakdown {
  role: "supports" | "limits" | "contradicts";
  independenceKey: string;
  suppressedObservationIds: readonly string[];
}
