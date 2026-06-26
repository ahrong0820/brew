import { recommendationRules } from "@/data/recommendation/rules";
import { evidenceRegistry } from "@/lib/evidence/registry";
import type {
  RecommendationRuleDefinition,
  RecommendationRuleRegistry,
} from "@/lib/types/recommendationRule";

export const recommendationRuleRegistryVersion = "1.1.0";

export const recommendationRuleRegistry: RecommendationRuleRegistry = {
  version: recommendationRuleRegistryVersion,
  rules: recommendationRules,
};

export type RecommendationRuleValidationCode =
  | "duplicate-rule-id"
  | "invalid-rule-version"
  | "missing-source"
  | "missing-observation"
  | "observation-source-mismatch"
  | "unreviewed-active-evidence"
  | "retracted-active-evidence"
  | "missing-deprecation-reason";

export interface RecommendationRuleValidationIssue {
  code: RecommendationRuleValidationCode;
  path: string;
  message: string;
}

export function validateRecommendationRuleRegistry(
  registry: RecommendationRuleRegistry,
): RecommendationRuleValidationIssue[] {
  const issues: RecommendationRuleValidationIssue[] = [];
  const seenIds = new Set<string>();
  const sourceById = new Map(
    evidenceRegistry.sources.map((source) => [source.id, source] as const),
  );
  const observationById = new Map(
    evidenceRegistry.observations.map((observation) => [
      observation.id,
      observation,
    ] as const),
  );

  registry.rules.forEach((rule, ruleIndex) => {
    const path = `rules[${ruleIndex}]`;

    if (seenIds.has(rule.id)) {
      issues.push({
        code: "duplicate-rule-id",
        path: `${path}.id`,
        message: `규칙 ID ${rule.id}가 중복됐습니다.`,
      });
    }
    seenIds.add(rule.id);

    if (!Number.isInteger(rule.version) || rule.version < 1) {
      issues.push({
        code: "invalid-rule-version",
        path: `${path}.version`,
        message: "규칙 버전은 1 이상의 정수여야 합니다.",
      });
    }

    if (
      rule.status === "deprecated" &&
      !rule.deprecationReason?.trim()
    ) {
      issues.push({
        code: "missing-deprecation-reason",
        path: `${path}.deprecationReason`,
        message: "폐기된 규칙에는 폐기 사유가 필요합니다.",
      });
    }

    rule.evidenceLinks.forEach((link, linkIndex) => {
      const linkPath = `${path}.evidenceLinks[${linkIndex}]`;
      const source = sourceById.get(link.sourceId);

      if (!source) {
        issues.push({
          code: "missing-source",
          path: `${linkPath}.sourceId`,
          message: `존재하지 않는 출처 ${link.sourceId}를 참조합니다.`,
        });
      }

      if (source?.status === "retracted" && rule.status === "active") {
        issues.push({
          code: "retracted-active-evidence",
          path: linkPath,
          message: "활성 규칙은 철회된 출처를 근거로 사용할 수 없습니다.",
        });
      }

      if (!link.observationId) {
        return;
      }

      const observation = observationById.get(link.observationId);
      if (!observation) {
        issues.push({
          code: "missing-observation",
          path: `${linkPath}.observationId`,
          message: `존재하지 않는 관찰값 ${link.observationId}를 참조합니다.`,
        });
        return;
      }

      if (observation.sourceId !== link.sourceId) {
        issues.push({
          code: "observation-source-mismatch",
          path: linkPath,
          message: `관찰값 ${link.observationId}의 출처와 규칙 연결 출처가 다릅니다.`,
        });
      }

      if (
        rule.status === "active" &&
        (link.role === "supports" || link.role === "calibrates") &&
        observation.reviewStatus !== "reviewed"
      ) {
        issues.push({
          code: "unreviewed-active-evidence",
          path: linkPath,
          message: "활성 규칙의 지지·교정 관찰값은 reviewed 상태여야 합니다.",
        });
      }
    });
  });

  return issues;
}

export function assertValidRecommendationRuleRegistry(
  registry: RecommendationRuleRegistry,
) {
  const issues = validateRecommendationRuleRegistry(registry);
  if (issues.length === 0) {
    return;
  }

  const details = issues
    .map((issue) => `${issue.code} ${issue.path}: ${issue.message}`)
    .join("\n");
  throw new Error(`Recommendation rule registry validation failed:\n${details}`);
}

assertValidRecommendationRuleRegistry(recommendationRuleRegistry);

const ruleById = new Map<string, RecommendationRuleDefinition>(
  recommendationRuleRegistry.rules.map((rule) => [rule.id, rule]),
);

export function getRecommendationRule(ruleId: string) {
  return ruleById.get(ruleId);
}

export function requireRecommendationRule(ruleId: string) {
  const rule = getRecommendationRule(ruleId);
  if (!rule) {
    throw new Error(`Unknown recommendation rule: ${ruleId}`);
  }
  return rule;
}

export function listActiveRecommendationRules() {
  return recommendationRuleRegistry.rules.filter(
    (rule) => rule.status === "active",
  );
}

export function resolveRecommendationRuleEvidence(ruleId: string) {
  const rule = requireRecommendationRule(ruleId);
  return rule.evidenceLinks.map((link) => ({
    link,
    source: evidenceRegistry.sources.find(
      (source) => source.id === link.sourceId,
    ),
    observation: link.observationId
      ? evidenceRegistry.observations.find(
          (observation) => observation.id === link.observationId,
        )
      : undefined,
  }));
}
