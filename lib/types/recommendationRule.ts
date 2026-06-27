import type { EvidenceContext } from "@/lib/types/evidence";
import type { RecommendationRuleParameter } from "@/lib/types/recommendation";

export type RecommendationRuleStatus =
  | "draft"
  | "active"
  | "deprecated"
  | "disabled";

export type RecommendationRuleImplementationKey =
  | "normalize-dose"
  | "taste-goal-ratio"
  | "dose-ratio-water"
  | "roast-process-taste-temperature"
  | "v60-hot-paper-roast-only-temperature"
  | "grinder-model-setting"
  | "k-ultra-official-zero-range"
  | "brewer-taste-pour"
  | "brewer-target-time"
  | "v60-hot-paper-foundation-pour"
  | "v60-hot-paper-foundation-time"
  | "v60-hot-paper-grind-direction"
  | "personal-profile-offset"
  | "personal-success-history";

export type RuleEvidenceRole =
  | "supports"
  | "limits"
  | "contradicts"
  | "context"
  | "calibrates";

export type RuleEvidenceApplicability =
  | "direct"
  | "partial"
  | "extrapolated";

export interface RuleEvidenceLink {
  sourceId: string;
  observationId?: string;
  role: RuleEvidenceRole;
  applicability: RuleEvidenceApplicability;
  note?: string;
}

export interface RecommendationRuleDefinition {
  id: string;
  version: number;
  status: RecommendationRuleStatus;
  title: string;
  description: string;
  parameter: RecommendationRuleParameter;
  implementationKey: RecommendationRuleImplementationKey;
  scope?: EvidenceContext;
  evidenceLinks: readonly RuleEvidenceLink[];
  introducedAt: string;
  deprecatedAt?: string;
  deprecationReason?: string;
  supersedes?: {
    ruleId: string;
    version: number;
  };
}

export interface RecommendationRuleRegistry {
  version: string;
  rules: readonly RecommendationRuleDefinition[];
}
