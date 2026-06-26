import { evidenceLineages, evidenceRegistry } from "@/lib/evidence/registry";
import { getCandidateRule } from "@/lib/recommendation/candidateRuleRegistry";
import { runCandidateSimulation } from "@/lib/recommendation/candidateSimulation";
import type { CandidateRuleTargetLayer } from "@/lib/types/candidateRule";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const candidateReadinessPolicyVersion = "1.1.0";

export const candidateReadinessPolicy = {
  simulation: {
    minimumSupportingObservations: 2,
    minimumDirectOrPartialSupportingObservations: 1,
  },
  promotionByTargetLayer: {
    "initial-recommendation": {
      minimumConfidenceScore: 0.65,
      minimumIndependentSupportFamilies: 2,
      minimumEmpiricalSupportingObservations: 1,
      maximumContradictingObservations: 0,
    },
    "post-brew-adjustment": {
      minimumConfidenceScore: 0.45,
      minimumIndependentSupportFamilies: 2,
      minimumEmpiricalSupportingObservations: 0,
      maximumContradictingObservations: 0,
    },
    informational: {
      minimumConfidenceScore: 0.5,
      minimumIndependentSupportFamilies: 1,
      minimumEmpiricalSupportingObservations: 0,
      maximumContradictingObservations: 0,
    },
  },
} as const;

export type CandidateReadinessStage =
  | "not-ready"
  | "simulation-ready"
  | "promotion-ready";

export type CandidateReadinessBlockerCode =
  | "candidate-status-not-reviewable"
  | "validation-plan-missing"
  | "supporting-observations-insufficient"
  | "supporting-observation-not-reviewed"
  | "applicable-support-insufficient"
  | "non-extraction-support-used"
  | "simulation-failed"
  | "confidence-below-policy"
  | "independent-support-insufficient"
  | "empirical-support-missing"
  | "contradiction-present";

export interface CandidateReadinessBlocker {
  code: CandidateReadinessBlockerCode;
  message: string;
}

function observationsFor(ids: readonly string[]) {
  const byId = new Map(
    evidenceRegistry.observations.map((observation) => [
      observation.id,
      observation,
    ] as const),
  );

  return ids
    .map((id) => byId.get(id))
    .filter((observation): observation is EvidenceObservation => Boolean(observation));
}

function includesString(values: readonly string[], value: string) {
  return values.includes(value);
}

function independenceFamilyId(observation: EvidenceObservation) {
  const lineage = evidenceLineages.find(
    (record) =>
      includesString(record.observationIds, observation.id) ||
      includesString(record.sourceIds, observation.sourceId),
  );

  return lineage?.independencePolicy === "single-author-family"
    ? lineage.familyId
    : observation.sourceId;
}

function isEmpiricalSupport(observation: EvidenceObservation) {
  return [
    "controlled",
    "observational",
    "manufacturer-specification",
    "personal-observation",
  ].includes(observation.assessment.methodologicalStrength);
}

function promotionPolicyFor(targetLayer: CandidateRuleTargetLayer | null) {
  return candidateReadinessPolicy.promotionByTargetLayer[
    targetLayer ?? "initial-recommendation"
  ];
}

function promotionPolicyLabel(targetLayer: CandidateRuleTargetLayer | null) {
  if (targetLayer === "post-brew-adjustment") {
    return "단일 변수 방향형 사후 조정";
  }

  if (targetLayer === "informational") {
    return "정보 제공";
  }

  return "숫자형 초기 추천";
}

export function assessCandidateReadiness(candidateRuleId: string) {
  const candidate = getCandidateRule(candidateRuleId);
  if (!candidate) {
    throw new Error(`Unknown candidate rule: ${candidateRuleId}`);
  }

  const supporting = observationsFor(candidate.supportingObservationIds);
  const limiting = observationsFor(candidate.limitingObservationIds);
  const contradicting = observationsFor(candidate.contradictingObservationIds);
  const reviewedSupporting = supporting.filter(
    (observation) => observation.reviewStatus === "reviewed",
  );
  const applicableSupporting = reviewedSupporting.filter(
    (observation) => observation.assessment.directness !== "indirect",
  );
  const empiricalSupporting = reviewedSupporting.filter(isEmpiricalSupport);
  const independentSupportFamilies = new Set(
    reviewedSupporting.map(independenceFamilyId),
  );
  const nonExtractionSupporting = reviewedSupporting.filter((observation) =>
    observation.tags.includes("not-extraction-rule"),
  );
  const simulation = candidate.validationPlan
    ? runCandidateSimulation(candidate.id)
    : null;
  const targetLayer = candidate.validationPlan?.targetLayer ?? null;
  const promotionPolicy = promotionPolicyFor(targetLayer);

  const simulationBlockers: CandidateReadinessBlocker[] = [];
  const promotionBlockers: CandidateReadinessBlocker[] = [];

  if (candidate.status !== "reviewed" && candidate.status !== "validated") {
    simulationBlockers.push({
      code: "candidate-status-not-reviewable",
      message: "reviewed 또는 validated 후보만 시뮬레이션할 수 있습니다.",
    });
  }

  if (!candidate.validationPlan) {
    simulationBlockers.push({
      code: "validation-plan-missing",
      message: "대상 계층, 단일 변경 변수와 검증 시나리오가 필요합니다.",
    });
  }

  if (
    supporting.length <
    candidateReadinessPolicy.simulation.minimumSupportingObservations
  ) {
    simulationBlockers.push({
      code: "supporting-observations-insufficient",
      message: "시뮬레이션 전 최소 2개의 지지 Observation이 필요합니다.",
    });
  }

  if (reviewedSupporting.length !== supporting.length) {
    simulationBlockers.push({
      code: "supporting-observation-not-reviewed",
      message: "모든 지지 Observation이 reviewed 상태여야 합니다.",
    });
  }

  if (
    applicableSupporting.length <
    candidateReadinessPolicy.simulation
      .minimumDirectOrPartialSupportingObservations
  ) {
    simulationBlockers.push({
      code: "applicable-support-insufficient",
      message: "직접 또는 부분 적용 가능한 지지 Observation이 필요합니다.",
    });
  }

  if (nonExtractionSupporting.length > 0) {
    simulationBlockers.push({
      code: "non-extraction-support-used",
      message: "not-extraction-rule Observation은 추출 후보의 지지 근거로 사용할 수 없습니다.",
    });
  }

  if (simulation && !simulation.allPassed) {
    simulationBlockers.push({
      code: "simulation-failed",
      message: `${simulation.failedScenarios}개의 dry-run 시나리오가 실패했습니다.`,
    });
  }

  promotionBlockers.push(...simulationBlockers);

  if (candidate.confidenceScore < promotionPolicy.minimumConfidenceScore) {
    promotionBlockers.push({
      code: "confidence-below-policy",
      message: `${promotionPolicyLabel(targetLayer)} 신뢰도 ${candidate.confidenceScore.toFixed(2)}가 승격 기준 ${promotionPolicy.minimumConfidenceScore.toFixed(2)}보다 낮습니다.`,
    });
  }

  if (
    independentSupportFamilies.size <
    promotionPolicy.minimumIndependentSupportFamilies
  ) {
    promotionBlockers.push({
      code: "independent-support-insufficient",
      message: "서로 독립적인 지지 근거 계보가 부족합니다.",
    });
  }

  if (
    empiricalSupporting.length <
    promotionPolicy.minimumEmpiricalSupportingObservations
  ) {
    promotionBlockers.push({
      code: "empirical-support-missing",
      message: "숫자형 초기 추천 승격에는 통제·관찰 연구 또는 직접 교정 자료가 최소 1건 필요합니다.",
    });
  }

  if (
    contradicting.length > promotionPolicy.maximumContradictingObservations
  ) {
    promotionBlockers.push({
      code: "contradiction-present",
      message: "해결되지 않은 반박 Observation이 있습니다.",
    });
  }

  const stage: CandidateReadinessStage =
    simulationBlockers.length > 0
      ? "not-ready"
      : promotionBlockers.length > 0
        ? "simulation-ready"
        : "promotion-ready";

  return {
    candidateRuleId: candidate.id,
    policyVersion: candidateReadinessPolicyVersion,
    targetLayer,
    stage,
    promotionPolicy,
    metrics: {
      supportingObservationCount: supporting.length,
      reviewedSupportingObservationCount: reviewedSupporting.length,
      directOrPartialSupportingObservationCount: applicableSupporting.length,
      empiricalSupportingObservationCount: empiricalSupporting.length,
      independentSupportFamilyCount: independentSupportFamilies.size,
      limitingObservationCount: limiting.length,
      contradictingObservationCount: contradicting.length,
      confidenceScore: candidate.confidenceScore,
    },
    simulation,
    simulationBlockers,
    promotionBlockers,
    warnings:
      reviewedSupporting.length > 0 &&
      reviewedSupporting.every(
        (observation) =>
          observation.assessment.reproducibility === "single-source",
      )
        ? [
            "모든 지지 Observation의 재현성 분류가 single-source입니다. 방향형 사후 조정에는 허용하지만 숫자형 초기 추천으로 일반화하지 않습니다.",
          ]
        : [],
  };
}
