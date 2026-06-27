import type { EvidenceObservation } from "@/lib/types/evidence";

const sourceId = "paper:scientific-reports:2020:16450";
const reviewedAt = "2026-06-27";
const createdAt = "2026-06-26T00:00:00Z";
const updatedAt = "2026-06-27T00:00:00Z";

const automaticDripContext = {
  brew: {
    brewerTypes: ["other"],
    drinkStyles: ["hot"],
    filterMaterials: ["paper"],
  },
} as const;

export const researchBatch1Observations = [
  {
    id: "obs:research-batch-1:temperature",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "상업용 자동 드립 브루어에서 TDS와 추출 수율을 같게 맞춘 87·90·93°C 조건은 훈련 패널의 전체 감각 프로필에 큰 온도 주효과를 보이지 않았습니다.",
    excerpt: {
      locator: {
        section: "Abstract; Results; Discussion; Methods",
        paragraph:
          "87, 90, and 93°C with TDS and percent extraction controlled",
      },
      paraphrase:
        "연구진은 세 온도에서 분쇄도, 유량과 투입 비율을 조정해 음료의 TDS와 추출 수율을 맞췄고, 훈련 패널 분석에서 온도 자체의 전반적 감각 효과가 작다고 보고했습니다.",
    },
    context: {
      ...automaticDripContext,
      brew: {
        ...automaticDripContext.brew,
        temperatureCelsius: { min: 87, max: 93, unit: "celsius" },
      },
    },
    variables: [
      {
        name: "temperatureCelsius",
        role: "intervention",
        value: { kind: "text", value: "discrete levels: 87, 90, 93 celsius" },
      },
      {
        name: "beverageTdsPercent",
        role: "control",
        value: { kind: "text", value: "matched across temperature conditions" },
      },
      {
        name: "extractionYieldPercent",
        role: "control",
        value: { kind: "text", value: "matched across temperature conditions" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "partially-applicable",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: [
        "상업용 프로그래머블 자동 드립 브루어와 평저형 바스켓을 사용한 조건으로 수동 V60의 열손실과 푸어 패턴을 직접 재현하지 않습니다.",
        "TDS와 추출 수율을 맞추기 위해 온도 조건별로 분쇄도, 유량과 투입 비율을 조정했으므로 온도만 바꾼 단일 변수 비교가 아닙니다.",
        "한 종류의 워시드 온두라스 블렌드를 사용해 가공 방식별 온도 오프셋을 검증하지 않습니다.",
        "결과는 시험한 87~93°C와 목표 농도·수율 범위 안에서 해석해야 하며 모든 온도에서 감각이 동일하다는 뜻이 아닙니다.",
        "배전도별 권장 주전자 설정 온도를 직접 제시하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "paper",
      "temperature",
      "automatic-drip",
      "controlled-comparison",
      "fixed-tds",
      "fixed-extraction-yield",
      "indirect-v60-context",
    ],
    createdAt,
    updatedAt,
  },
  {
    id: "obs:research-batch-1:tds-pe-sensory-profile",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "자동 드립 커피의 감각 프로필은 시험한 범위에서 추출 온도보다 TDS와 추출 수율의 영향을 크게 받았고, 특히 TDS가 감각 차이의 더 큰 축이었습니다.",
    excerpt: {
      locator: {
        section:
          "Results — Multivariate and univariate analyses; Principal component analysis; Discussion — Impact of total dissolved solids and percent extraction on sensory profile",
        figure: "Figures 3–6",
        paragraph:
          "TDS and PE significantly affected sensory attributes; TDS explained more product-space variance than PE",
      },
      paraphrase:
        "훈련 패널 결과에서 TDS와 추출 수율은 감각 속성에 유의한 영향을 보였으며, TDS가 추출 수율보다 제품 간 감각 차이를 더 크게 설명했습니다. 높은 TDS 방향에서는 쓴맛·떫은감·점성이 증가했고, 낮은 TDS 방향에서는 과일향과 홍차 계열 속성이 증가했습니다.",
    },
    context: automaticDripContext,
    variables: [
      {
        name: "beverageTdsPercent",
        role: "intervention",
        value: { kind: "range", min: 1, max: 1.5, unit: "percent" },
      },
      {
        name: "extractionYieldPercent",
        role: "intervention",
        value: { kind: "range", min: 16, max: 24, unit: "percent" },
      },
      {
        name: "sensoryBitterness",
        role: "measurement",
        value: { kind: "text", value: "increased toward higher TDS" },
      },
      {
        name: "sensoryAstringency",
        role: "measurement",
        value: { kind: "text", value: "increased toward higher TDS" },
      },
      {
        name: "sensoryBody",
        role: "measurement",
        value: { kind: "text", value: "viscous mouthfeel increased toward higher TDS" },
      },
    ],
    outcome: {
      variable: "sensoryBody",
      direction: "association",
      comparisonGroup: "lower versus higher beverage TDS",
      statisticalSignificance: {
        reported: true,
        significant: true,
      },
      sensoryDescription:
        "높은 TDS에서 점성·쓴맛·떫은감이 증가했고 낮은 TDS 방향에서 과일향과 홍차 계열 속성이 증가했습니다.",
    },
    assessment: {
      extractionConfidence: "high",
      directness: "partially-applicable",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: [
        "상업용 자동 드립 브루어와 평저형 바스켓을 사용해 수동 V60의 유동과 열손실을 직접 재현하지 않습니다.",
        "TDS와 추출 수율은 비율만이 아니라 분쇄도, 유량, 추출 시간과 함께 조절됐습니다.",
        "감각 기술 분석이며 특정 맛 목표에 대한 소비자 선호도 또는 단일 최적 비율을 검증한 연구가 아닙니다.",
        "한 종류의 워시드 온두라스 블렌드를 사용했으므로 산지·가공·품종 전반에 동일한 크기로 일반화하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "paper",
      "automatic-drip",
      "tds",
      "extraction-yield",
      "sensory",
      "body",
      "bitterness",
      "astringency",
      "indirect-v60-context",
    ],
    createdAt,
    updatedAt,
  },
  {
    id: "obs:research-batch-1:brew-ratio-coupled-control",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "연구진은 목표 TDS와 추출 수율에 도달하기 위해 투입 비율을 분쇄도·유량·추출 시간과 함께 조정했으며, 브루어와 원두별로 필요한 절차가 달라진다고 명시했습니다.",
    excerpt: {
      locator: {
        section: "Methods — Brewing; Discussion — Limitations and application",
        table: "Supplementary Table S1",
        paragraph:
          "brew ratio, grind size, flow rate and brew time were adjusted to reach target TDS and PE; procedures vary by brewer and coffee",
      },
      paraphrase:
        "동일한 물량에서 커피 투입량을 바꿔 비율을 조절했지만 분쇄도와 물 공급 주기·유량·시간도 함께 바뀌었습니다. 연구진은 목표 TDS와 추출 수율을 만드는 정확한 절차가 브루어와 원두에 따라 달라진다고 제한했습니다.",
    },
    context: automaticDripContext,
    variables: [
      {
        name: "brewRatio",
        role: "intervention",
        value: {
          kind: "text",
          value: "varied jointly with grind, flow and brew time to target TDS and extraction yield",
        },
      },
      {
        name: "grinderSetting",
        role: "control",
        value: { kind: "text", value: "adjusted by target condition" },
      },
      {
        name: "flowRateGramsPerSecond",
        role: "control",
        value: { kind: "text", value: "adjusted by target condition" },
      },
      {
        name: "targetTimeSeconds",
        role: "control",
        value: { kind: "text", value: "adjusted by target condition" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "partially-applicable",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: [
        "투입 비율의 독립적인 감각 효과를 분리한 비교가 아닙니다.",
        "맛 목표별 1:15·1:15.5·1:16·1:16.5 숫자를 직접 제안하거나 검증하지 않습니다.",
        "자동 평저형 브루어의 대용량 배치 조건이므로 V60 소용량 레시피로 수치 자체를 복사하지 않습니다.",
        "개별 추출에서는 실제 TDS와 추출 수율을 측정하지 않으면 비율만으로 감각 결과를 확정할 수 없습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "paper",
      "automatic-drip",
      "brew-ratio",
      "coupled-variables",
      "tds",
      "extraction-yield",
      "limitation",
      "indirect-v60-context",
    ],
    createdAt,
    updatedAt,
  },
] as const satisfies readonly EvidenceObservation[];
