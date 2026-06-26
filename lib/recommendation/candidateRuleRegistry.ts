import { candidateRules } from "@/data/recommendation/candidateRules";
import { evidenceRegistry } from "@/lib/evidence/registry";
import type {
  CandidateEvidenceRole,
  CandidateEvidenceSourceGroup,
  CandidateRule,
  CandidateRuleRegistry,
} from "@/lib/types/candidateRule";

export const candidateRuleRegistryVersion = "1.0.0";

export const candidateRuleRegistry: CandidateRuleRegistry = {
  version: candidateRuleRegistryVersion,
  rules: candidateRules,
};

export type CandidateRuleValidationCode =
  | "duplicate-candidate-id"
  | "invalid-revision"
  | "invalid-confidence-score"
  | "missing-observation"
  | "duplicate-observation-role"
  | "missing-review-metadata"
  | "missing-rejection-reason"
  | "invalid-promotion"
  | "personal-rule-without-personal-evidence";

export interface CandidateRuleValidationIssue {
  code: CandidateRuleValidationCode;
  path: string;
  message: string;
}

function observationEntries(rule: CandidateRule) {
  return [
    ...rule.supportingObservationIds.map((observationId) => ({
      observationId,
      role: "supports" as const,
    })),
    ...rule.limitingObservationIds.map((observationId) => ({
      observationId,
      role: "limits" as const,
    })),
    ...rule.contradictingObservationIds.map((observationId) => ({
      observationId,
      role: "contradicts" as const,
    })),
  ];
}

export function validateCandidateRuleRegistry(
  registry: CandidateRuleRegistry,
): CandidateRuleValidationIssue[] {
  const issues: CandidateRuleValidationIssue[] = [];
  const seenIds = new Set<string>();
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
        code: "duplicate-candidate-id",
        path: `${path}.id`,
        message: `후보 규칙 ID ${rule.id}가 중복됐습니다.`,
      });
    }
    seenIds.add(rule.id);

    if (!Number.isInteger(rule.revision) || rule.revision < 1) {
      issues.push({
        code: "invalid-revision",
        path: `${path}.revision`,
        message: "후보 규칙 revision은 1 이상의 정수여야 합니다.",
      });
    }

    if (
      !Number.isFinite(rule.confidenceScore) ||
      rule.confidenceScore < 0 ||
      rule.confidenceScore > 1
    ) {
      issues.push({
        code: "invalid-confidence-score",
        path: `${path}.confidenceScore`,
        message: "후보 규칙 confidenceScore는 0 이상 1 이하여야 합니다.",
      });
    }

    if (
      rule.status !== "draft" &&
      (!rule.reviewedBy?.trim() || !rule.reviewedAt?.trim())
    ) {
      issues.push({
        code: "missing-review-metadata",
        path,
        message: "검수된 후보 규칙에는 검수자와 검수일이 필요합니다.",
      });
    }

    if (rule.status === "rejected" && !rule.rejectionReason?.trim()) {
      issues.push({
        code: "missing-rejection-reason",
        path: `${path}.rejectionReason`,
        message: "거절된 후보 규칙에는 거절 사유가 필요합니다.",
      });
    }

    if (
      rule.promotion &&
      (rule.status !== "validated" ||
        !Number.isInteger(rule.promotion.ruleVersion) ||
        rule.promotion.ruleVersion < 1 ||
        !rule.promotion.ruleId.trim() ||
        !rule.promotion.ruleRegistryVersion.trim() ||
        !rule.promotion.promotedAt.trim())
    ) {
      issues.push({
        code: "invalid-promotion",
        path: `${path}.promotion`,
        message:
          "승격 기록은 validated 후보에만 허용되며 활성 규칙 ID·버전·레지스트리 버전·승격일이 필요합니다.",
      });
    }

    const seenObservationIds = new Set<string>();
    let hasPersonalEvidence = false;

    observationEntries(rule).forEach(({ observationId, role }) => {
      const evidencePath = `${path}.${role}.${observationId}`;

      if (seenObservationIds.has(observationId)) {
        issues.push({
          code: "duplicate-observation-role",
          path: evidencePath,
          message: `관찰값 ${observationId}가 여러 근거 역할에 중복 등록됐습니다.`,
        });
      }
      seenObservationIds.add(observationId);

      const observation = observationById.get(observationId);
      if (!observation) {
        issues.push({
          code: "missing-observation",
          path: evidencePath,
          message: `존재하지 않는 관찰값 ${observationId}를 참조합니다.`,
        });
        return;
      }

      const source = evidenceRegistry.sources.find(
        (candidate) => candidate.id === observation.sourceId,
      );
      hasPersonalEvidence ||= source?.type === "personal";
    });

    if (rule.audience === "personal" && !hasPersonalEvidence) {
      issues.push({
        code: "personal-rule-without-personal-evidence",
        path: `${path}.audience`,
        message: "개인 후보 규칙은 개인 Observation을 하나 이상 참조해야 합니다.",
      });
    }
  });

  return issues;
}

export function assertValidCandidateRuleRegistry(
  registry: CandidateRuleRegistry,
) {
  const issues = validateCandidateRuleRegistry(registry);
  if (issues.length === 0) {
    return;
  }

  const details = issues
    .map((issue) => `${issue.code} ${issue.path}: ${issue.message}`)
    .join("\n");
  throw new Error(`Candidate rule registry validation failed:\n${details}`);
}

assertValidCandidateRuleRegistry(candidateRuleRegistry);

const candidateById = new Map<string, CandidateRule>(
  candidateRuleRegistry.rules.map((rule) => [rule.id, rule]),
);
const observationById = new Map(
  evidenceRegistry.observations.map((observation) => [
    observation.id,
    observation,
  ] as const),
);

export function getCandidateRule(candidateRuleId: string) {
  return candidateById.get(candidateRuleId);
}

export function listCandidateRules(options?: {
  status?: CandidateRule["status"];
  audience?: CandidateRule["audience"];
}) {
  return candidateRuleRegistry.rules.filter(
    (rule) =>
      (!options?.status || rule.status === options.status) &&
      (!options?.audience || rule.audience === options.audience),
  );
}

export function groupCandidateEvidenceBySource(
  candidateRuleId: string,
): readonly CandidateEvidenceSourceGroup[] {
  const rule = getCandidateRule(candidateRuleId);
  if (!rule) {
    throw new Error(`Unknown candidate rule: ${candidateRuleId}`);
  }

  const groups = new Map<
    string,
    { observationIds: Set<string>; roles: Set<CandidateEvidenceRole> }
  >();

  observationEntries(rule).forEach(({ observationId, role }) => {
    const observation = observationById.get(observationId);
    if (!observation) {
      return;
    }

    const group = groups.get(observation.sourceId) ?? {
      observationIds: new Set<string>(),
      roles: new Set<CandidateEvidenceRole>(),
    };
    group.observationIds.add(observationId);
    group.roles.add(role);
    groups.set(observation.sourceId, group);
  });

  return [...groups.entries()].map(([sourceId, group]) => ({
    sourceId,
    observationIds: [...group.observationIds],
    roles: [...group.roles],
  }));
}

export function summarizeCandidateEvidence(candidateRuleId: string) {
  const groups = groupCandidateEvidenceBySource(candidateRuleId);
  return {
    independentSourceCount: groups.length,
    observationCount: groups.reduce(
      (count, group) => count + group.observationIds.length,
      0,
    ),
    sourceGroups: groups,
  };
}
