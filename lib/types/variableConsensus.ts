import type { EvidenceContext } from "@/lib/types/evidence";
import type { WeightedEvidenceEntry } from "@/lib/types/evidenceWeight";

export type RecommendationVariable =
  | "ratio"
  | "temperature"
  | "grind"
  | "flowRate"
  | "actualTime"
  | "bloom"
  | "pourCount"
  | "pourRateHeight"
  | "agitation"
  | "bypass"
  | "waterComposition";

export type VariableConsensusStatus =
  | "insufficient"
  | "aligned"
  | "conditional"
  | "conflicted";

export type AdjustmentDirection =
  | "increase"
  | "decrease"
  | "finer"
  | "coarser"
  | "hold";

export type GuardResponse = "continue" | "stop" | "rollback" | "hold";

export type GuardOperator =
  | "above"
  | "below"
  | "at-or-above"
  | "at-or-below"
  | "equals"
  | "present";

export interface VariableAdjustmentGuard {
  id: string;
  metric:
    | RecommendationVariable
    | "sensoryAstringency"
    | "sensoryBitterness"
    | "channeling"
    | "stalling"
    | "overallPreference";
  operator: GuardOperator;
  reference: string;
  response: GuardResponse;
  adjustmentDirection?: AdjustmentDirection;
  reason: string;
  evidenceObservationIds: readonly string[];
}

export interface CandidateVariablePlan {
  candidateRuleId: string;
  variable: RecommendationVariable;
  proposedDirection: AdjustmentDirection;
  controlVariables: readonly RecommendationVariable[];
  adjustmentOrder: readonly string[];
  guards: readonly VariableAdjustmentGuard[];
}

export interface VariableConsensusThresholds {
  minSupportingContributions: number;
  minSupportScore: number;
  conditionalLimitScore: number;
  conflictScore: number;
  conflictRatioToSupport: number;
  limitConfidencePenalty: number;
}

export interface VariableConsensusPolicy {
  version: string;
  thresholds: VariableConsensusThresholds;
}

export interface VariableRoleSummary {
  combinedScore: number;
  contributionCount: number;
  sourceKeys: readonly string[];
  entries: readonly WeightedEvidenceEntry[];
}

export interface VariableConsensusAssessment {
  candidateRuleId: string;
  variable: RecommendationVariable;
  targetContext: EvidenceContext;
  status: VariableConsensusStatus;
  support: VariableRoleSummary;
  limits: VariableRoleSummary;
  contradictions: VariableRoleSummary;
  confidenceScore: number;
  proposedDirection: AdjustmentDirection;
  controlVariables: readonly RecommendationVariable[];
  adjustmentOrder: readonly string[];
  guards: readonly VariableAdjustmentGuard[];
  reasons: readonly string[];
  evidenceWeightPolicyVersion: string;
  variableConsensusPolicyVersion: string;
}
