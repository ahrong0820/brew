import type {
  CandidateVariablePlan,
  VariableConsensusPolicy,
} from "@/lib/types/variableConsensus";

export const variableConsensusPolicy = {
  version: "1.0.0",
  thresholds: {
    minSupportingContributions: 2,
    minSupportScore: 0.35,
    conditionalLimitScore: 0.15,
    conflictScore: 0.25,
    conflictRatioToSupport: 0.75,
    limitConfidencePenalty: 0.35,
  },
} as const satisfies VariableConsensusPolicy;

export const candidateVariablePlans = [
  {
    candidateRuleId: "candidate:grind:v60-hot:dial-in-v1",
    variable: "grind",
    proposedDirection: "finer",
    controlVariables: ["ratio", "temperature"],
    adjustmentOrder: [
      "기본 도징·비율·온도와 푸어 구조를 우선 고정합니다.",
      "예상보다 충분히 굵은 초기 분쇄도에서 시작합니다.",
      "실제 추출 시간과 맛을 함께 확인하며 작은 폭으로 미세화합니다.",
      "중단 또는 되돌림 가드가 충족되면 미세화를 멈춥니다.",
    ],
    guards: [
      {
        id: "guard:grind:v60-hot:target-time-upper-bound",
        metric: "actualTime",
        operator: "above",
        reference: "recipe.targetTimeMaxSeconds",
        response: "rollback",
        adjustmentDirection: "coarser",
        reason:
          "목표 시간 상한을 넘으면 유속 저하와 막힘 위험이 커질 수 있으므로 한 단계 굵게 되돌립니다.",
        evidenceObservationIds: [
          "obs:expert-data-2:target-time-over-nominal-setting",
          "obs:expert-data-2:coarse-first-recovery",
        ],
      },
      {
        id: "guard:grind:v60-hot:astringency-increase",
        metric: "sensoryAstringency",
        operator: "present",
        reference: "increased-from-previous-attempt",
        response: "rollback",
        adjustmentDirection: "coarser",
        reason:
          "떫은맛이 증가하면 과도한 미세화, 막힘 또는 채널링 가능성을 고려해 굵게 되돌립니다.",
        evidenceObservationIds: [
          "obs:expert-data-1:v60-grind-sensitivity",
          "obs:expert-data-2:coarse-first-recovery",
        ],
      },
      {
        id: "guard:grind:v60-hot:stall-or-channel",
        metric: "stalling",
        operator: "present",
        reference: "visible-stall-or-channeling",
        response: "rollback",
        adjustmentDirection: "coarser",
        reason:
          "막힘 또는 채널링이 관찰되면 미세화를 중단하고 분쇄도를 굵게 조정합니다.",
        evidenceObservationIds: [
          "obs:expert-data-2:grind-setting-context-dependence",
          "obs:expert-data-2:coarse-first-recovery",
        ],
      },
      {
        id: "guard:grind:v60-hot:preferred-cup",
        metric: "overallPreference",
        operator: "equals",
        reference: "good",
        response: "hold",
        adjustmentDirection: "hold",
        reason:
          "목표 시간 범위 안에서 선호 결과가 나오면 추가 미세화를 멈추고 현재 설정을 유지합니다.",
        evidenceObservationIds: [
          "obs:expert-data-2:target-time-over-nominal-setting",
        ],
      },
    ],
  },
] as const satisfies readonly CandidateVariablePlan[];
