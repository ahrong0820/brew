import { candidateRules } from "@/data/recommendation/candidateRules";
import { v60TemperatureCandidateRules } from "@/data/recommendation/v60TemperatureCandidateRules";
import { evidenceRegistry } from "@/lib/evidence/registry";
import type {
  CandidateEvidenceRole,
  CandidateEvidenceSourceGroup,
  CandidateRule,
  CandidateRuleRegistry,
} from "@/lib/types/candidateRule";

export const candidateRuleRegistryVersion = "1.4.0";

export const candidateRuleRegistry: CandidateRuleRegistry = {
  version: candidateRuleRegistryVersion,
  rules: [...candidateRules, ...v60TemperatureCandidateRules],
};

export type CandidateRuleValidationCode =
  | "duplicate-candidate-id"
  | "invalid-revision"
  | "invalid-confidence-score"
  | "missing-observation"
  | "duplicate-observation-role"
  | "missing-review-metadata"
  | "missing-rejection-reason"
  | "missing-validation-plan"
  | "invalid-validation-plan"
  | "validation-plan-parameter-mismatch"
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

function hasDuplicates(values: readonly string[]) {
  return new Set(values).size !== values.length;
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
      (rule.status === "reviewed" || rule.status === "validated") &&
      !rule.validationPlan
    ) {
      issues.push({
        code: "missing-validation-plan",
        path: `${path}.validationPlan`,
        message: "reviewed 또는 validated 후보에는 검증 계획이 필요합니다.",
      });
    }

    if (rule.validationPlan) {
      const plan = rule.validationPlan;
      const invalidPlan =
        !plan.implementationKey.trim() ||
        plan.changedParameters.length !== 1 ||
        plan.scenarioIds.length === 0 ||
        plan.acceptanceCriteria.length === 0 ||
        hasDuplicates(plan.scenarioIds) ||
        plan.heldConstantParameters.some((parameter) =>
          plan.changedParameters.includes(parameter),
        );

      if (invalidPlan) {
        issues.push({
          code: "invalid-validation-plan",
          path: `${path}.validationPlan`,
          message:
            "검증 계획은 구현 키, 단일 변경 변수, 중복 없는 시나리오와 수용 기준을 포함해야 하며 고정 변수와 변경 변수가 겹치면 안 됩니다.",
        });
      }

      if (plan.changedParameters[0] !== rule.parameter) {
        issues.push({
          code: "validation-plan-parameter-mismatch",
          path: `${path}.validationPlan.changedParameters`,
          message: "검증 계획의 단일 변경 변수는 후보 규칙 parameter와 같아야 합니다.",
        });
      }
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

export function groupCandidateEvidenceBySource(candidateRuleId: string) {
  const rule = getCandidateRule(candidateRuleId);
  if (!rule) {
    return [];
  }

  const groups = new Map<string, CandidateEvidenceSourceGroup>();
  observationEntries(rule).forEach(({ observationId, role }) => {
    const observation = observationById.get(observationId);
    if (!observation) {
      return;
    }

    const current = groups.get(observation.sourceId);
    groups.set(observation.sourceId, {
      sourceId: observation.sourceId,
      observationIds: [
        ...(current?.observationIds ?? []),
        observationId,
      ],
      roles: [...(current?.roles ?? []), role],
    });
  });

  return [...groups.values()];
}

export function summarizeCandidateEvidence(candidateRuleId: string) {
  const groups = groupCandidateEvidenceBySource(candidateRuleId);
  return {
    independentSourceCount: groups.length,
    supportObservationCount: groups.reduce(
      (count, group) =>
        count + group.roles.filter((role) => role === "supports").length,
      0,
    ),
    limitingObservationCount: groups.reduce(
      (count, group) =>
        count + group.roles.filter((role) => role === "limits").length,
      0,
    ),
    contradictionObservationCount: groups.reduce(
      (count, group) =>
        count + group.roles.filter((role) => role === "contradicts").length,
      0,
    ),
    sourceGroups: groups,
  };
}
