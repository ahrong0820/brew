import type { EvidenceContext } from "@/lib/types/evidence";
import type { RecommendationRuleParameter } from "@/lib/types/recommendation";

export type CandidateRuleStatus =
  | "draft"
  | "reviewed"
  | "validated"
  | "rejected";

export type CandidateRuleAudience = "global" | "personal";

export type CandidateRuleTargetLayer =
  | "initial-recommendation"
  | "post-brew-adjustment"
  | "informational";

export interface CandidateRuleValidationPlan {
  targetLayer: CandidateRuleTargetLayer;
  implementationKey: string;
  changedParameters: readonly RecommendationRuleParameter[];
  heldConstantParameters: readonly RecommendationRuleParameter[];
  scenarioIds: readonly string[];
  acceptanceCriteria: readonly string[];
}

export interface CandidateRulePromotion {
  ruleId: string;
  ruleVersion: number;
  ruleRegistryVersion: string;
  promotedAt: string;
}

export interface CandidateRule {
  id: string;
  revision: number;
  parameter: RecommendationRuleParameter;
  hypothesis: string;
  scope: EvidenceContext;
  audience: CandidateRuleAudience;
  supportingObservationIds: readonly string[];
  limitingObservationIds: readonly string[];
  contradictingObservationIds: readonly string[];
  status: CandidateRuleStatus;
  confidenceScore: number;
  validationPlan?: CandidateRuleValidationPlan;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  promotion?: CandidateRulePromotion;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateRuleRegistry {
  version: string;
  rules: readonly CandidateRule[];
}

export type CandidateEvidenceRole = "supports" | "limits" | "contradicts";

export interface CandidateEvidenceSourceGroup {
  sourceId: string;
  observationIds: readonly string[];
  roles: readonly CandidateEvidenceRole[];
}
