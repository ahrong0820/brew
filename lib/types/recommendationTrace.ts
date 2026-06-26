export type RecommendationTraceParameter =
  | "dose"
  | "water"
  | "ratio"
  | "temperature"
  | "grind"
  | "time"
  | "pour"
  | "confidence"
  | "personalization";

export interface RecommendationTraceEvidenceRef {
  sourceId: string;
  observationId?: string;
  role?: "supports" | "limits" | "contradicts" | "context" | "calibrates";
  applicability?: "direct" | "partial" | "extrapolated";
}

export interface AppliedRuleTrace {
  ruleId: string;
  ruleVersion?: number;
  parameter: RecommendationTraceParameter;
  evidenceRefs: RecommendationTraceEvidenceRef[];
}

export interface RecommendationTraceSnapshot {
  engineVersion: string;
  ruleRegistryVersion: string;
  evidenceRegistryVersion: string;
  generatedAt: string;
  appliedRules: AppliedRuleTrace[];
}
