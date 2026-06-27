import type { EvidenceObservation } from "@/lib/types/evidence";

const sourceId = "expert:sca:standard-310-2021-home-brewers";
const reviewedAt = "2026-06-27";
const timestamp = "2026-06-27T00:00:00Z";

const automaticFilterContext = {
  brew: {
    brewerTypes: ["other"],
    drinkStyles: ["hot"],
    filterMaterials: ["paper"],
  },
} as const;

export const standardsBrewing1Observations = [
  {
    id: "obs:standard:sca-310:brew-ratio-55-g-per-kg",
    sourceId,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "SCA 310-2021은 가정용 전기 필터 브루어 시험과 사용 설명의 표준 비율로 물 1kg당 커피 55g을 사용합니다.",
    excerpt: {
      locator: {
        page: 6,
        section: "6.7 Operating Manuals and Other Instructional Materials",
        table: "Table 1",
        paragraph: "coffee/water ratio of 55 g/kg",
      },
      paraphrase:
        "표준은 브루어 설명서에 55g/kg 또는 이에 상응하는 커피·물 비율을 안내하도록 요구하고 시험에도 같은 표준 비율을 사용합니다.",
    },
    context: {
      ...automaticFilterContext,
      brew: {
        ...automaticFilterContext.brew,
        ratio: { min: 55, max: 55, unit: "coffee g per water kg" },
      },
    },
    variables: [
      {
        name: "brewRatio",
        role: "condition",
        value: {
          kind: "number",
          value: 55,
          unit: "coffee g per water kg",
        },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "이 값은 전기식 가정용 필터 브루어의 규격 시험과 설명서 기준이며 수동 V60의 감각 최적 비율 실험 결과가 아닙니다.",
        "표준의 적용 범위는 수동 푸어오버를 명시적으로 제외합니다.",
        "55g/kg은 커피 질량 대 물 질량 표기이므로 앱의 물:커피 비율 표기와 혼동하지 않습니다.",
        "맛 목표별 비율 차이를 제시하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "standard",
      "sca-310",
      "automatic-filter-brewer",
      "ratio",
      "indirect-v60-context",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:standard:sca-310:brewing-temperature-90-96",
    sourceId,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "SCA 310-2021은 가정용 전기 필터 브루어의 슬러리 온도가 물의 33%가 공급될 때까지 90~96°C에 도달하고 이후 추출 동안 그 범위를 유지하도록 규정합니다.",
    excerpt: {
      locator: {
        page: 6,
        section: "6.2 Brewing Temperature",
        table: "Table 1",
        paragraph: "90 to 96°C range",
      },
      paraphrase:
        "브루어는 물 질량의 33%가 커피에 공급되는 시점까지 슬러리 온도를 90~96°C로 올리고 남은 추출 주기 동안 유지해야 합니다.",
    },
    context: {
      ...automaticFilterContext,
      brew: {
        ...automaticFilterContext.brew,
        temperatureCelsius: { min: 90, max: 96, unit: "celsius" },
      },
    },
    variables: [
      {
        name: "temperatureCelsius",
        role: "condition",
        value: { kind: "range", min: 90, max: 96, unit: "celsius" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "partially-applicable",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "규정값은 투입수의 주전자 설정 온도가 아니라 전기 브루어 커피층의 슬러리 측정 온도입니다.",
        "수동 V60은 열손실과 주입 방식이 달라 동일한 주전자 설정값으로 직접 치환할 수 없습니다.",
        "표준은 수동 푸어오버를 적용 범위에서 제외합니다.",
        "배전도·가공 방식·맛 목표별 온도 오프셋을 제시하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "standard",
      "sca-310",
      "automatic-filter-brewer",
      "temperature",
      "slurry-temperature",
      "indirect-v60-context",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:standard:sca-310:manual-pour-over-excluded",
    sourceId,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "SCA 310-2021의 적용 범위는 전기식 가정용 필터 브루어이며 수동 푸어오버 장치를 명시적으로 제외합니다.",
    excerpt: {
      locator: {
        page: 4,
        section: "02. Scope",
        paragraph: "Manual brewing devices (i.e., pour over devices) are excluded",
      },
      paraphrase:
        "표준의 범위 설명은 수동 추출 장치, 예를 들어 푸어오버 장치를 이 규격의 적용 대상에서 제외한다고 명시합니다.",
    },
    context: automaticFilterContext,
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "이 관찰값은 수치 권장이 아니라 SCA 수치의 V60 적용 가능성을 제한하는 범위 정보입니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "standard",
      "sca-310",
      "scope",
      "manual-pour-over-excluded",
      "limitation",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
] as const satisfies readonly EvidenceObservation[];
