import type { CandidateRule } from "@/lib/types/candidateRule";

export const candidateRules = [
  {
    id: "candidate:grind:v60-hot:dial-in-v1",
    revision: 1,
    parameter: "grind",
    hypothesis:
      "종이 필터 HOT V60에서는 기본 도징·비율·온도를 유지한 채 충분히 굵은 초기값에서 시작해 목표 시간과 감각 결과가 허용하는 범위까지 점진적으로 미세화하고, 막힘·채널링·떫은맛이 증가하면 굵게 되돌린다.",
    scope: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
    },
    audience: "global",
    supportingObservationIds: [
      "obs:expert-data-1:v60-grind-sensitivity",
      "obs:expert-data-2:foundational-recipe-grind-first",
      "obs:expert-data-2:target-time-over-nominal-setting",
    ],
    limitingObservationIds: [
      "obs:expert-data-2:grind-setting-context-dependence",
      "obs:expert-data-2:coarse-first-recovery",
    ],
    contradictingObservationIds: [],
    status: "reviewed",
    confidenceScore: 0.46,
    validationPlan: {
      targetLayer: "post-brew-adjustment",
      implementationKey: "v60-hot-paper-grind-direction-v1",
      changedParameters: ["grind"],
      heldConstantParameters: ["dose", "ratio", "temperature", "pour"],
      scenarioIds: [
        "candidate-sim:v60-hot-paper:fast-sour-k-ultra",
        "candidate-sim:v60-hot-paper:fast-weak-encore",
        "candidate-sim:v60-hot-paper:slow-astringent-k-ultra",
        "candidate-sim:v60-hot-paper:target-astringent-encore",
        "candidate-sim:v60-hot-paper:target-good-k-ultra",
        "candidate-sim:switch-hot-paper:fast-sour-out-of-scope",
        "candidate-sim:v60-iced-paper:fast-sour-out-of-scope",
        "candidate-sim:v60-hot-metal:fast-sour-out-of-scope",
      ],
      acceptanceCriteria: [
        "적용 범위의 빠른 추출은 분쇄도 미세화 방향만 제안합니다.",
        "적용 범위의 느린 추출 또는 떫은맛은 분쇄도 굵게 조정 방향만 제안합니다.",
        "좋음 평가는 현재 분쇄도를 유지합니다.",
        "브루어·음료 스타일·필터가 적용 범위와 다르면 후보 효과를 내지 않습니다.",
        "도징·비율·온도·푸어 구조는 변경하지 않습니다.",
      ],
    },
    reviewedBy: "project-maintainer",
    reviewedAt: "2026-06-26",
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly CandidateRule[];
