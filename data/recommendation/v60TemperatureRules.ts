import type { RecommendationRuleDefinition } from "@/lib/types/recommendationRule";

export const v60TemperatureRules = [
  {
    id: "temperature.v60-hot-paper.roast-only.v1",
    version: 1,
    status: "active",
    title: "HOT V60 배전도 기준 초기 온도",
    description:
      "HOT V60에서는 기존 배전도 기준값을 유지하고 맛 목표·가공 방식 온도 오프셋을 적용하지 않음",
    parameter: "temperature",
    implementationKey: "v60-hot-paper-roast-only-temperature",
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
        observationId: "obs:expert-data-1:v60-temperature-range",
        role: "supports",
        applicability: "direct",
        note: "V60의 일반 온도 범위와 열손실 맥락을 제공하지만 배전도별 숫자 매핑은 검증하지 않습니다.",
      },
      {
        sourceId: "paper:scientific-reports:2020:16450",
        observationId: "obs:research-batch-1:temperature",
        role: "supports",
        applicability: "partial",
        note: "TDS와 추출 수율이 같을 때 시험 온도 자체의 전체 감각 효과가 작았던 통제 자동 드립 결과입니다.",
      },
      {
        sourceId: "expert:sca:standard-310-2021-home-brewers",
        observationId: "obs:standard:sca-310:brewing-temperature-90-96",
        role: "context",
        applicability: "partial",
        note: "자동 필터 브루어 슬러리의 넓은 온도 규격이며 주전자 설정값으로 직접 치환하지 않습니다.",
      },
      {
        sourceId: "expert:sca:standard-310-2021-home-brewers",
        observationId: "obs:standard:sca-310:manual-pour-over-excluded",
        role: "limits",
        applicability: "direct",
        note: "SCA 310은 수동 푸어오버를 적용 범위에서 제외하므로 간접 맥락으로만 사용합니다.",
      },
      {
        sourceId: "internal:initial-rule-set:v1",
        observationId: "obs:internal:initial-rule-set:baseline-v1",
        role: "context",
        applicability: "direct",
        note: "배전도별 기본 숫자는 기존 휴리스틱을 유지하며 이 규칙에서 새로 검증된 값으로 간주하지 않습니다.",
      },
    ],
    introducedAt: "2026-06-27",
  },
] as const satisfies readonly RecommendationRuleDefinition[];
