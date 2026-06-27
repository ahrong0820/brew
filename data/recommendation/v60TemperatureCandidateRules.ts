import type { CandidateRule } from "@/lib/types/candidateRule";

export const v60TemperatureCandidateRules = [
  {
    id: "candidate:temperature:v60-hot:roast-only-v1",
    revision: 1,
    parameter: "temperature",
    hypothesis:
      "종이 필터 HOT V60의 초기 온도는 현재 배전도 기준값을 유지하되, 직접 검증되지 않은 맛 목표 및 가공 방식 오프셋을 추가하지 않는다.",
    scope: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
    },
    audience: "global",
    supportingObservationIds: [
      "obs:expert-data-1:v60-temperature-range",
      "obs:research-batch-1:temperature",
      "obs:standard:sca-310:brewing-temperature-90-96",
    ],
    limitingObservationIds: [
      "obs:standard:sca-310:manual-pour-over-excluded",
    ],
    contradictingObservationIds: [],
    status: "validated",
    confidenceScore: 0.74,
    validationPlan: {
      targetLayer: "initial-recommendation",
      implementationKey: "v60-hot-paper-roast-only-temperature-v1",
      changedParameters: ["temperature"],
      heldConstantParameters: ["dose", "ratio", "grind", "pour", "time"],
      scenarioIds: [
        "candidate-sim:v60-temperature:light-washed-bright",
        "candidate-sim:v60-temperature:light-natural-body",
        "candidate-sim:v60-temperature:medium-fermented-bright",
        "candidate-sim:v60-temperature:dark-natural-body",
        "candidate-sim:v60-temperature:unknown-fermented-bright",
        "candidate-sim:v60-temperature:iced-out-of-scope",
        "candidate-sim:v60-temperature:switch-out-of-scope",
        "candidate-sim:v60-temperature:metal-out-of-scope",
      ],
      acceptanceCriteria: [
        "같은 배전도에서는 맛 목표와 가공 방식이 달라도 초기 온도가 같습니다.",
        "배전도별 기존 기준값 94·92·90·88·85°C와 미확인 91°C를 유지합니다.",
        "HOT V60 종이필터 밖에서는 후보 효과를 내지 않습니다.",
        "도징·비율·분쇄도·푸어·목표 시간은 변경하지 않습니다.",
        "개인 추출 이력의 온도 보정은 이 초기값 이후에 별도로 적용됩니다.",
      ],
    },
    reviewedBy: "project-maintainer",
    reviewedAt: "2026-06-27",
    promotion: {
      ruleId: "temperature.v60-hot-paper.roast-only.v1",
      ruleVersion: 1,
      ruleRegistryVersion: "1.4.0",
      promotedAt: "2026-06-27",
    },
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  },
] as const satisfies readonly CandidateRule[];
