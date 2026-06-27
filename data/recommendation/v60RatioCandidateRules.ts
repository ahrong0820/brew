import type { CandidateRule } from "@/lib/types/candidateRule";

export const v60RatioCandidateRules = [
  {
    id: "candidate:ratio:v60-hot:foundation-16-v1",
    revision: 1,
    parameter: "ratio",
    hypothesis:
      "종이 필터 HOT V60의 초기 비율은 맛 목표와 무관하게 1:16으로 시작하고, 농도·추출 방향은 분쇄도와 개인 추출 이력으로 조정한다.",
    scope: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
    },
    audience: "global",
    supportingObservationIds: [
      "obs:expert-data-1:v60-ratio-range",
      "obs:research-batch-1:tds-pe-sensory-profile",
    ],
    limitingObservationIds: [
      "obs:research-batch-1:brew-ratio-coupled-control",
      "obs:manufacturer:hario-v60:serving-dose-reference",
      "obs:standard:sca-310:brew-ratio-55-g-per-kg",
      "obs:standard:sca-310:manual-pour-over-excluded",
    ],
    contradictingObservationIds: [],
    status: "validated",
    confidenceScore: 0.72,
    validationPlan: {
      targetLayer: "initial-recommendation",
      implementationKey: "v60-hot-paper-foundation-ratio-16-v1",
      changedParameters: ["ratio"],
      heldConstantParameters: ["dose", "temperature", "grind", "pour", "time"],
      scenarioIds: [
        "candidate-sim:v60-ratio:sweet",
        "candidate-sim:v60-ratio:bright",
        "candidate-sim:v60-ratio:balanced",
        "candidate-sim:v60-ratio:body",
        "candidate-sim:v60-ratio:dose-20",
        "candidate-sim:v60-ratio:iced-out-of-scope",
        "candidate-sim:v60-ratio:switch-out-of-scope",
        "candidate-sim:v60-ratio:metal-out-of-scope",
      ],
      acceptanceCriteria: [
        "HOT V60 종이필터의 네 가지 맛 목표가 모두 1:16 초기 비율을 사용합니다.",
        "물량은 정규화된 도징과 비율에서 5g 단위로 다시 계산합니다.",
        "HOT V60 종이필터 밖에서는 후보 효과를 내지 않습니다.",
        "온도·분쇄도·푸어·목표 시간은 변경하지 않습니다.",
        "개인 추출 이력의 비율 보정은 1:16 초기값 이후에 적용됩니다.",
      ],
    },
    reviewedBy: "project-maintainer",
    reviewedAt: "2026-06-27",
    promotion: {
      ruleId: "ratio.v60-hot-paper.foundation-16.v1",
      ruleVersion: 1,
      ruleRegistryVersion: "1.5.0",
      promotedAt: "2026-06-27",
    },
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  },
] as const satisfies readonly CandidateRule[];
