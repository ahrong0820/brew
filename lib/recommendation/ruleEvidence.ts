import { getEvidenceSource } from "@/lib/evidence/registry";
import { requireRecommendationRule } from "@/lib/recommendation/ruleRegistry";
import type {
  AppliedRecommendationRule,
  RecommendationEvidenceKind,
  RecommendationRuleParameter,
} from "@/lib/types/recommendation";

export const initialHeuristicSourceId = "internal:initial-rule-set:v1";
export const personalHistorySourceId = "local:user-brew-history";

function evidenceKindForSource(sourceId: string): RecommendationEvidenceKind {
  const source = getEvidenceSource(sourceId);

  switch (source?.type) {
    case "paper":
      return "published";
    case "competition":
      return "competition";
    case "expert":
      return "expert";
    case "manufacturer":
      return "manufacturer";
    case "personal":
      return "personal";
    case "internal":
    default:
      return "heuristic";
  }
}

export function createAppliedRuleFromRegistry(
  ruleId: string,
): AppliedRecommendationRule {
  const rule = requireRecommendationRule(ruleId);

  return {
    id: rule.id,
    version: rule.version,
    parameter: rule.parameter,
    description: rule.description,
    evidence: rule.evidenceLinks.map((link) => ({
      kind: evidenceKindForSource(link.sourceId),
      sourceId: link.sourceId,
      observationId: link.observationId,
      role: link.role,
      applicability: link.applicability,
      note: link.note,
    })),
  };
}

/**
 * Compatibility helper for callers that construct transient rules.
 * Registered recommendation rules should use createAppliedRuleFromRegistry.
 */
export function createAppliedRule(input: {
  id: string;
  parameter: RecommendationRuleParameter;
  description: string;
  evidenceKind?: RecommendationEvidenceKind;
  sourceId?: string;
  evidenceNote?: string;
}): AppliedRecommendationRule {
  return {
    id: input.id,
    parameter: input.parameter,
    description: input.description,
    evidence: [
      {
        kind: input.evidenceKind ?? "heuristic",
        sourceId: input.sourceId ?? initialHeuristicSourceId,
        note: input.evidenceNote,
      },
    ],
  };
}

export function appendAppliedRule(
  rules: AppliedRecommendationRule[],
  rule: AppliedRecommendationRule,
) {
  return rules.some((candidate) => candidate.id === rule.id)
    ? rules
    : [...rules, rule];
}
