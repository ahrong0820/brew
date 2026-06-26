import type { BrewRecommendation } from "@/lib/types/recommendation";
import type { RecommendationTraceSnapshot } from "@/lib/types/recommendationTrace";

export function buildRecommendationTrace(
  recommendation: BrewRecommendation,
  generatedAt: string,
  engineVersion: string,
  ruleRegistryVersion: string,
  evidenceRegistryVersion: string,
): RecommendationTraceSnapshot {
  return {
    engineVersion,
    ruleRegistryVersion,
    evidenceRegistryVersion,
    generatedAt,
    appliedRules: (recommendation.appliedRules ?? []).map((rule) => ({
      ruleId: rule.id,
      ruleVersion: rule.version,
      parameter: rule.parameter,
      evidenceRefs: rule.evidence.map((evidence) => ({
        sourceId: evidence.sourceId,
        observationId: evidence.observationId,
        role: evidence.role,
        applicability: evidence.applicability,
      })),
    })),
  };
}
