import type {
  AppliedRecommendationRule,
  RecommendationEvidenceKind,
  RecommendationRuleParameter,
} from "@/lib/types/recommendation";

export const initialHeuristicSourceId = "internal:initial-rule-set-v1";
export const personalHistorySourceId = "local:user-brew-history";

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
