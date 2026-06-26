import type { WeightedEvidenceEntry } from "@/lib/types/evidenceWeight";
import type {
  VariableConsensusStatus,
  VariableConsensusThresholds,
  VariableRoleSummary,
} from "@/lib/types/variableConsensus";

export function combineIndependentEvidenceScores(
  scores: readonly number[],
): number {
  if (scores.length === 0) {
    return 0;
  }

  const combined = 1 - scores.reduce(
    (remaining, score) => remaining * (1 - Math.max(0, Math.min(1, score))),
    1,
  );
  return Math.max(0, Math.min(1, combined));
}

export function summarizeEvidenceRole(
  entries: readonly WeightedEvidenceEntry[],
): VariableRoleSummary {
  return {
    combinedScore: combineIndependentEvidenceScores(
      entries.map((entry) => entry.finalScore),
    ),
    contributionCount: entries.length,
    sourceKeys: [...new Set(entries.map((entry) => entry.independenceKey))],
    entries,
  };
}

export function classifyVariableConsensus(
  support: VariableRoleSummary,
  limits: VariableRoleSummary,
  contradictions: VariableRoleSummary,
  thresholds: VariableConsensusThresholds,
): VariableConsensusStatus {
  if (
    support.contributionCount < thresholds.minSupportingContributions ||
    support.combinedScore < thresholds.minSupportScore
  ) {
    return "insufficient";
  }

  if (
    contradictions.combinedScore >= thresholds.conflictScore &&
    contradictions.combinedScore >=
      support.combinedScore * thresholds.conflictRatioToSupport
  ) {
    return "conflicted";
  }

  if (
    limits.combinedScore >= thresholds.conditionalLimitScore ||
    contradictions.combinedScore > 0
  ) {
    return "conditional";
  }

  return "aligned";
}

export function calculateConsensusConfidence(
  support: VariableRoleSummary,
  limits: VariableRoleSummary,
  contradictions: VariableRoleSummary,
  thresholds: VariableConsensusThresholds,
): number {
  const contradictionRetention = 1 - contradictions.combinedScore;
  const limitRetention =
    1 - limits.combinedScore * thresholds.limitConfidencePenalty;

  return Math.max(
    0,
    Math.min(
      1,
      support.combinedScore * contradictionRetention * limitRetention,
    ),
  );
}

export function consensusReasons(
  status: VariableConsensusStatus,
  support: VariableRoleSummary,
  limits: VariableRoleSummary,
  contradictions: VariableRoleSummary,
): readonly string[] {
  const reasons = [
    `독립 지지 기여 ${support.contributionCount}건, 결합 지지 점수 ${support.combinedScore.toFixed(3)}`,
    `독립 제한 기여 ${limits.contributionCount}건, 결합 제한 점수 ${limits.combinedScore.toFixed(3)}`,
    `독립 반박 기여 ${contradictions.contributionCount}건, 결합 반박 점수 ${contradictions.combinedScore.toFixed(3)}`,
  ];

  if (status === "insufficient") {
    return [
      ...reasons,
      "활성 규칙 승격에 필요한 독립 지지 수 또는 지지 점수가 부족합니다.",
    ];
  }
  if (status === "conflicted") {
    return [
      ...reasons,
      "지지와 반박의 충돌이 커서 한 방향의 활성 규칙으로 승격할 수 없습니다.",
    ];
  }
  if (status === "conditional") {
    return [
      ...reasons,
      "지지 근거는 있으나 제한 또는 반박 근거가 있어 중단·되돌림 조건이 필요합니다.",
    ];
  }
  return [
    ...reasons,
    "현재 적용 범위에서는 지지 근거가 정렬되어 있으며 유의미한 제한·반박 점수가 없습니다.",
  ];
}
