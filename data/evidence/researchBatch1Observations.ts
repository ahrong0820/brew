import type { EvidenceObservation } from "@/lib/types/evidence";

export const researchBatch1Observations = [
  {
    id: "obs:research-batch-1:temperature",
    sourceId: "paper:scientific-reports:2020:16450",
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
      brew: {
        brewerTypes: ["other"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
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
      reviewedAt: "2026-06-27",
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
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
