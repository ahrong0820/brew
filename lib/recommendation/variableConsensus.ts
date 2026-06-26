import {
  candidateVariablePlans,
  variableConsensusPolicy,
} from "@/data/recommendation/variableConsensusPolicies";
import { getCandidateRule } from "@/lib/recommendation/candidateRuleRegistry";
import { scoreCandidateRuleEvidence } from "@/lib/recommendation/evidenceWeight";
import {
  calculateConsensusConfidence,
  classifyVariableConsensus,
  consensusReasons,
  summarizeEvidenceRole,
} from "@/lib/recommendation/variableConsensusCore";
import type { EvidenceContext } from "@/lib/types/evidence";
import type { CandidateVariablePlan } from "@/lib/types/variableConsensus";

export type VariableConsensusValidationCode =
  | "duplicate-plan"
  | "missing-candidate"
  | "parameter-mismatch"
  | "missing-guard-evidence"
  | "guard-evidence-outside-candidate"
  | "missing-rollback-direction";

export interface VariableConsensusValidationIssue {
  code: VariableConsensusValidationCode;
  path: string;
  message: string;
}

export function validateCandidateVariablePlans(
  plans: readonly CandidateVariablePlan[],
): VariableConsensusValidationIssue[] {
  const issues: VariableConsensusValidationIssue[] = [];
  const seenCandidateIds = new Set<string>();

  plans.forEach((plan, planIndex) => {
    const path = `plans[${planIndex}]`;
    if (seenCandidateIds.has(plan.candidateRuleId)) {
      issues.push({
        code: "duplicate-plan",
        path: `${path}.candidateRuleId`,
        message: `후보 규칙 ${plan.candidateRuleId}의 변수 계획이 중복됐습니다.`,
      });
    }
    seenCandidateIds.add(plan.candidateRuleId);

    const candidate = getCandidateRule(plan.candidateRuleId);
    if (!candidate) {
      issues.push({
        code: "missing-candidate",
        path: `${path}.candidateRuleId`,
        message: `존재하지 않는 후보 규칙 ${plan.candidateRuleId}를 참조합니다.`,
      });
      return;
    }

    if (candidate.parameter !== plan.variable) {
      issues.push({
        code: "parameter-mismatch",
        path: `${path}.variable`,
        message: `후보 규칙 parameter ${candidate.parameter}와 변수 계획 ${plan.variable}가 다릅니다.`,
      });
    }

    const candidateObservationIds = new Set([
      ...candidate.supportingObservationIds,
      ...candidate.limitingObservationIds,
      ...candidate.contradictingObservationIds,
    ]);

    plan.guards.forEach((guard, guardIndex) => {
      const guardPath = `${path}.guards[${guardIndex}]`;
      if (guard.evidenceObservationIds.length === 0) {
        issues.push({
          code: "missing-guard-evidence",
          path: `${guardPath}.evidenceObservationIds`,
          message: "중단·되돌림 가드에는 근거 Observation이 필요합니다.",
        });
      }

      guard.evidenceObservationIds.forEach((observationId) => {
        if (!candidateObservationIds.has(observationId)) {
          issues.push({
            code: "guard-evidence-outside-candidate",
            path: `${guardPath}.evidenceObservationIds`,
            message: `가드 근거 ${observationId}가 후보 규칙에 연결되지 않았습니다.`,
          });
        }
      });

      if (guard.response === "rollback" && !guard.adjustmentDirection) {
        issues.push({
          code: "missing-rollback-direction",
          path: `${guardPath}.adjustmentDirection`,
          message: "되돌림 가드에는 조정 방향이 필요합니다.",
        });
      }
    });
  });

  return issues;
}

export function assertValidCandidateVariablePlans(
  plans: readonly CandidateVariablePlan[],
) {
  const issues = validateCandidateVariablePlans(plans);
  if (issues.length === 0) {
    return;
  }

  const details = issues
    .map((issue) => `${issue.code} ${issue.path}: ${issue.message}`)
    .join("\n");
  throw new Error(`Variable consensus plan validation failed:\n${details}`);
}

assertValidCandidateVariablePlans(candidateVariablePlans);

export function getCandidateVariablePlan(candidateRuleId: string) {
  return candidateVariablePlans.find(
    (plan) => plan.candidateRuleId === candidateRuleId,
  );
}

export function assessCandidateVariableConsensus(
  candidateRuleId: string,
  targetContext: EvidenceContext,
  options?: {
    personalSuccessCounts?: Readonly<Record<string, number>>;
  },
) {
  const plan = getCandidateVariablePlan(candidateRuleId);
  if (!plan) {
    throw new Error(`Unknown candidate variable plan: ${candidateRuleId}`);
  }

  const weighted = scoreCandidateRuleEvidence(candidateRuleId, targetContext, {
    personalSuccessCounts: options?.personalSuccessCounts,
  });
  const support = summarizeEvidenceRole(
    weighted.entries.filter((entry) => entry.role === "supports"),
  );
  const limits = summarizeEvidenceRole(
    weighted.entries.filter((entry) => entry.role === "limits"),
  );
  const contradictions = summarizeEvidenceRole(
    weighted.entries.filter((entry) => entry.role === "contradicts"),
  );
  const status = classifyVariableConsensus(
    support,
    limits,
    contradictions,
    variableConsensusPolicy.thresholds,
  );
  const confidenceScore = calculateConsensusConfidence(
    support,
    limits,
    contradictions,
    variableConsensusPolicy.thresholds,
  );

  return {
    candidateRuleId,
    variable: plan.variable,
    targetContext,
    status,
    support,
    limits,
    contradictions,
    confidenceScore,
    proposedDirection: plan.proposedDirection,
    controlVariables: plan.controlVariables,
    adjustmentOrder: plan.adjustmentOrder,
    guards: plan.guards,
    reasons: consensusReasons(status, support, limits, contradictions),
    evidenceWeightPolicyVersion: weighted.policyVersion,
    variableConsensusPolicyVersion: variableConsensusPolicy.version,
  };
}
