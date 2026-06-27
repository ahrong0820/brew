import type { RecommendationRuleDefinition } from "@/lib/types/recommendationRule";

export const v60RatioRules = [
  {
    id: "ratio.v60-hot-paper.foundation-16.v1",
    version: 1,
    status: "active",
    title: "HOT V60 1:16 초기 비율",
    description:
      "HOT V60에서는 맛 목표별 고정 비율 오프셋 대신 1:16 공통 시작점을 적용",
    parameter: "ratio",
    implementationKey: "v60-hot-paper-foundation-ratio",
    scope: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
    },
    evidenceLinks: [
      {
        sourceId: "expert:coffee-ad-astra:v60-2018",
        observationId: "obs:expert-data-1:v60-ratio-range",
        role: "supports",
        applicability: "direct",
        note: "V60의 실용 범위 1:15~1:17과 저자의 기본 선택 1:16을 초기 시작점으로 사용합니다.",
      },
      {
        sourceId: "paper:scientific-reports:2020:16450",
        observationId: "obs:research-batch-1:tds-pe-sensory-profile",
        role: "supports",
        applicability: "partial",
        note: "농도와 추출 수율이 감각 프로필을 크게 좌우하므로 맛 목표를 비율 하나에 고정하지 않는 근거입니다.",
      },
      {
        sourceId: "paper:scientific-reports:2020:16450",
        observationId: "obs:research-batch-1:brew-ratio-coupled-control",
        role: "limits",
        applicability: "partial",
        note: "비율은 분쇄도·유량·시간과 결합된 변수였으므로 1:16을 유일한 최적값으로 해석하지 않습니다.",
      },
      {
        sourceId: "manufacturer:hario:v60-dripper-manual-global",
        observationId: "obs:manufacturer:hario-v60:serving-dose-reference",
        role: "limits",
        applicability: "direct",
        note: "공식 설명서의 120mL 제공량은 정밀한 투입수 비율로 환산하지 않습니다.",
      },
      {
        sourceId: "expert:sca:standard-310-2021-home-brewers",
        observationId: "obs:standard:sca-310:brew-ratio-55-g-per-kg",
        role: "context",
        applicability: "partial",
        note: "자동 필터 브루어의 55g/kg 기준은 간접 범위 맥락으로만 사용합니다.",
      },
      {
        sourceId: "expert:sca:standard-310-2021-home-brewers",
        observationId: "obs:standard:sca-310:manual-pour-over-excluded",
        role: "limits",
        applicability: "direct",
        note: "SCA 310은 수동 푸어오버를 제외하므로 V60 직접 수치 근거로 사용하지 않습니다.",
      },
      {
        sourceId: "internal:initial-rule-set:v1",
        observationId: "obs:internal:initial-rule-set:baseline-v1",
        role: "context",
        applicability: "direct",
        note: "공통 시작점 채택은 보수적 기본값이며 개인 기록과 실제 추출 결과로 조정합니다.",
      },
    ],
    introducedAt: "2026-06-27",
  },
] as const satisfies readonly RecommendationRuleDefinition[];
