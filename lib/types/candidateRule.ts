import type { EvidenceContext } from "@/lib/types/evidence";
import type { RecommendationRuleParameter } from "@/lib/types/recommendation";

export type CandidateRuleStatus =
  | "draft"
  | "reviewed"
  | "validated"
  | "rejected";

export type CandidateRuleAudience = "global" | "personal";

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
