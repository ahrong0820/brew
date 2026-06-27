import type { RecommendationRuleDefinition } from "@/lib/types/recommendationRule";

export const v60ReferenceGrindRules = [
  {
    id: "grind.v60-hot-paper.reference-start-no-bean-offsets.v1",
    version: 1,
    status: "active",
    title: "HOT V60 비공식 교정 기준점 보수 적용",
    description:
      "K-Ultra 버 비접촉 영점과 기본형 Encore의 기존 모델별 기준점은 유지하되 배전도·가공 방식·맛 목표·도징 분쇄도 오프셋은 적용하지 않음",
    parameter: "grind",
    implementationKey: "v60-hot-paper-reference-grind",
    scope: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
      grinder: { models: ["1zpresso-k-ultra", "baratza-encore"] },
    },
    evidenceLinks: [
      {
        sourceId: "internal:initial-rule-set:v1",
        observationId: "obs:internal:initial-rule-set:baseline-v1",
        role: "context",
        applicability: "direct",
        note: "기존 모델별 기준점만 호환성 시작점으로 유지하며 새 숫자나 원두 속성별 차등값을 추가하지 않습니다.",
      },
      {
        sourceId: "expert:scott-rao:brewing-different-coffees-2024",
        observationId: "obs:expert-data-2:target-time-over-nominal-setting",
        role: "limits",
        applicability: "partial",
        note: "명목 다이얼값보다 목표 시간과 감각 결과를 우선하므로 원두 속성별 고정 오프셋을 제거합니다.",
      },
      {
        sourceId: "expert:scott-rao:choose-grind-setting-2026",
        observationId: "obs:expert-data-2:grind-setting-context-dependence",
        role: "limits",
        applicability: "direct",
        note: "그라인더·도징·미분량에 따라 적정 분쇄도가 달라지므로 기준점을 보편적 최적값으로 해석하지 않습니다.",
      },
      {
        sourceId: "expert:coffee-ad-astra:v60-2018",
        observationId: "obs:expert-data-1:v60-grind-sensitivity",
        role: "limits",
        applicability: "direct",
        note: "V60에서는 분쇄도 변화가 유속과 추출에 직접 영향을 주므로 실제 추출 후 한 변수씩 다이얼인합니다.",
      },
    ],
    introducedAt: "2026-06-27",
  },
] as const satisfies readonly RecommendationRuleDefinition[];
