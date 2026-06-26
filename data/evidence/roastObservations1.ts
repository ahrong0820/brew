import type { EvidenceObservation } from "@/lib/types/evidence";

const sourceId = "paper:doi:10.3390/beverages6020029";
const reviewedAt = "2026-06-26";
const timestamp = "2026-06-26T00:00:00Z";

const standardizedBrewContext = {
  brew: {
    doseGrams: { min: 50, max: 50, unit: "g" },
    waterGrams: { min: 900, max: 900, unit: "g" },
    temperatureCelsius: { min: 92, max: 92, unit: "celsius" },
    targetTimeSeconds: { min: 210, max: 210, unit: "seconds" },
  },
} as const;

const sharedAssessment = {
  extractionConfidence: "high",
  directness: "indirect",
  methodologicalStrength: "controlled",
  reproducibility: "single-source",
  reviewedBy: "project-maintainer",
  reviewedAt,
} as const;

export const roastObservations1 = [
  {
    id: "obs:roast-research-1:colour-stronger-than-timing",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "배전 색도와 시간 모두 감각 프로필과 관련됐지만, 논문의 직접 비교에서는 배전 색도가 시간 변수보다 전반적으로 더 강한 예측 변수였습니다.",
    excerpt: {
      locator: {
        section: "3.1. Relative Impact of Roast Colour and Timing on Coffee Flavour",
        table: "Table 4",
        paragraph: "colour correlations generally larger than timing correlations",
      },
      paraphrase:
        "색도와 시간 변화를 함께 포함한 연구에서 감각 속성과의 상관 크기를 비교했을 때 색도 계수가 대체로 더 컸고, 저자들은 배전 색도가 시간보다 풍미 차이를 더 잘 설명한다고 결론냈습니다.",
    },
    context: standardizedBrewContext,
    variables: [
      {
        name: "sensoryBitterness",
        role: "measurement",
        value: {
          kind: "text",
          value: "roast colour association stronger than timing association",
        },
      },
      {
        name: "sensoryAcidity",
        role: "measurement",
        value: {
          kind: "text",
          value: "roast colour association stronger than timing association",
        },
      },
      {
        name: "sensorySweetness",
        role: "measurement",
        value: {
          kind: "text",
          value: "roast colour association stronger than timing association",
        },
      },
    ],
    assessment: {
      ...sharedAssessment,
      limitations: [
        "색도와 시간의 직접 상관 비교는 8개 연구 전체가 아니라 두 연구의 데이터에 기반합니다.",
        "한 논문 안의 여러 연구를 사용했으므로 독립 출처 여러 개의 재현으로 계산하지 않습니다.",
        "감각 평가용 시료는 50 g 커피, 900 mL 물, 92 C, 3분 30초의 프렌치프레스 조건으로 표준화됐습니다.",
        "배전 색도가 추출 용해도나 권장 물 온도를 직접 결정한다는 연구가 아닙니다.",
      ],
    },
    tags: [
      "paper",
      "roast",
      "roast-colour",
      "roast-time",
      "sensory",
      "controlled-comparison",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:roast-research-1:darker-roast-sensory-direction",
    sourceId,
    kind: "measured-association",
    reviewStatus: "reviewed",
    summary:
      "더 어두운 배전은 쓴맛 증가와 연관됐고, 산미·과일향·단맛 감소와 연관됐습니다.",
    excerpt: {
      locator: {
        section: "3.1. Relative Impact of Roast Colour and Timing on Coffee Flavour",
        table: "Table 4",
        paragraph:
          "darker roast positively correlated with bitterness and negatively with sweetness, acidity, and fruitiness",
      },
      paraphrase:
        "배전 색도가 어두워질수록 쓴맛 평가는 높아지고 단맛, 산미, 과일향 평가는 낮아지는 방향의 상관이 보고됐습니다.",
    },
    context: standardizedBrewContext,
    variables: [
      {
        name: "sensoryBitterness",
        role: "measurement",
        value: { kind: "enum", value: "increase-with-darker-roast" },
      },
      {
        name: "sensoryAcidity",
        role: "measurement",
        value: { kind: "enum", value: "decrease-with-darker-roast" },
      },
      {
        name: "sensorySweetness",
        role: "measurement",
        value: { kind: "enum", value: "decrease-with-darker-roast" },
      },
    ],
    outcome: {
      variable: "sensoryBitterness",
      direction: "increase",
      comparisonGroup: "darker roast colour",
      statisticalSignificance: {
        reported: true,
      },
      sensoryDescription:
        "쓴맛은 증가하고 산미·과일향·단맛은 감소하는 방향이었습니다.",
    },
    assessment: {
      ...sharedAssessment,
      limitations: [
        "상관 방향은 연구의 배전 범위와 사용한 커피 및 로스터 조건 안에서 해석해야 합니다.",
        "과일향은 현재 구조화 변수명이 없어 요약과 감각 설명에만 보존했습니다.",
        "감각 평가용 추출 조건이 표준화돼 다른 브루어와 레시피에서 동일한 감각 크기가 재현된다고 단정할 수 없습니다.",
        "어두운 배전이라는 사실만으로 특정 분쇄도·비율·온도 보정을 활성화하지 않습니다.",
      ],
    },
    tags: [
      "paper",
      "roast",
      "dark-roast",
      "bitterness",
      "acidity",
      "sweetness",
      "fruitiness",
      "sensory",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:roast-research-1:development-time-over-first-crack",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "동일한 배전 색도에서 시간 변화를 비교했을 때, 개발 시간은 1차 크랙까지의 시간보다 감각 속성에 더 큰 영향을 보였습니다.",
    excerpt: {
      locator: {
        section: "3.2. Impact of Timing Variation: Which Roasting Phase Is Most Important?",
        table: "Table 5",
        paragraph:
          "development time had a larger influence than time to first crack",
      },
      paraphrase:
        "두 배전 구간의 회귀 결과에서 개발 시간은 모든 평가 속성에 유의한 효과를 보였고, 1차 크랙까지의 시간은 일부 속성에서만 유의해 개발 시간이 더 영향력 있는 시간 변수로 해석됐습니다.",
    },
    context: standardizedBrewContext,
    variables: [
      {
        name: "sensoryAcidity",
        role: "measurement",
        value: {
          kind: "text",
          value: "decreased with longer time in both roast phases",
        },
      },
      {
        name: "sensoryBitterness",
        role: "measurement",
        value: {
          kind: "text",
          value: "increased with longer time in both roast phases",
        },
      },
      {
        name: "sensorySweetness",
        role: "measurement",
        value: {
          kind: "text",
          value: "decreased significantly with longer development time",
        },
      },
    ],
    outcome: {
      variable: "sensoryBitterness",
      direction: "association",
      comparisonGroup: "development time versus time to first crack",
      statisticalSignificance: {
        reported: true,
      },
      sensoryDescription:
        "개발 시간이 1차 크랙까지의 시간보다 전반적인 감각 변화와 더 강하게 관련됐습니다.",
    },
    assessment: {
      ...sharedAssessment,
      limitations: [
        "시간 구간 회귀에서는 입력 범위가 크게 달랐던 Study 1이 제외됐습니다.",
        "개발 시간 효과는 배전 색도를 고정한 조건에서 해석해야 하며 절대 시간값을 다른 로스터에 그대로 이전할 수 없습니다.",
        "연구의 감각 결과는 프렌치프레스 표준 시료에 기반하며 V60 추출 권장값을 직접 제시하지 않습니다.",
        "더 긴 개발 시간을 권장하는 규칙이 아니라 감각 변화의 상대적 영향 관계입니다.",
      ],
    },
    tags: [
      "paper",
      "roast",
      "development-time",
      "first-crack",
      "sensory",
      "controlled-comparison",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
] as const satisfies readonly EvidenceObservation[];
