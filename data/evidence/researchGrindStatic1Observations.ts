import type { EvidenceObservation } from "@/lib/types/evidence";

const sourceId = "paper:arxiv:2312.03103:v3";

export const researchGrindStatic1Observations = [
  {
    id: "obs:research-grind-static-1:water-shifts-expelled-psd",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "다크 로스트 EK43 실험에서 분쇄 전 소량의 물은 정전기성 미분 부착과 그라인더 잔류를 줄이고, 배출 원두의 입도 분포를 더 작은 직경 쪽으로 이동시켰습니다.",
    excerpt: {
      locator: { page: 9, figure: "Figure 4", section: "Aggregate formation" },
      paraphrase:
        "Figure 4에서 무처리 잔류분에는 미분이 집중됐고, 10 µL/g 물 처리는 잔류량을 약 2.5%로 낮추며 배출 입도의 평균을 더 작게 이동시켰습니다. 무처리와 출구 이온화 조건의 잔류량은 약 12% 수준이었습니다.",
    },
    context: {
      bean: { roastLevels: ["dark"] },
      grinder: {
        models: ["other"],
        burrTypes: ["flat-98mm-stock"],
      },
      environment: {
        roomTemperatureCelsius: { min: 17, max: 23, unit: "celsius" },
        humidityPercent: { min: 28, max: 42, unit: "percent-rh" },
      },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "control",
        value: { kind: "text", value: "Mahlkönig EK43 setting 2.0" },
      },
      {
        name: "pregrindWaterMicrolitersPerGram",
        role: "intervention",
        value: { kind: "range", min: 0, max: 100, unit: "microliter-per-gram" },
      },
      {
        name: "grinderRetentionPercent",
        role: "measurement",
        value: {
          kind: "text",
          value: "approximately 2.5% at 10 µL/g versus approximately 12% without treatment",
        },
      },
      {
        name: "representativeMicrons",
        role: "measurement",
        value: {
          kind: "text",
          value: "mean expelled particle diameter shifted smaller up to 50 µL/g",
        },
      },
    ],
    outcome: {
      variable: "representativeMicrons",
      direction: "decrease",
      sensoryDescription:
        "정전기 완화로 그라인더 내부에 붙어 있던 미분이 배출 분포에 다시 포함된 결과입니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "indirect",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: [
        "프리프린트이며 독립 재현 연구가 아닙니다.",
        "입도와 잔류 실험은 특정 EK43 stock 98 mm burrs와 시험 원두에 한정됩니다.",
        "분쇄 설정을 미세화한 실험이 아니라 분쇄 전 수분으로 정전기와 미분 회수를 바꾼 실험입니다.",
        "V60 유속 또는 종이 필터 막힘을 직접 측정하지 않았습니다.",
        "50 µL/g보다 많은 물에서는 습식 응집으로 평균 입도가 다시 증가하는 비선형 결과가 관찰됐습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "paper",
      "preprint",
      "grinder-static",
      "particle-size-distribution",
      "fines",
      "retention",
      "indirect-for-v60",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "obs:research-grind-static-1:dark-espresso-flow-tds",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "다크 로스트 에스프레소에서 10 µL/g의 분쇄 전 물 처리는 더 긴 샷 시간, 낮은 유속, 높은 TDS와 연관됐습니다.",
    excerpt: {
      locator: {
        page: 10,
        figure: "Figure 5a",
        section: "The effect of charge mitigation on espresso quality",
      },
      paraphrase:
        "18 g 도징, 45 g 음료, 94°C, 7 bar와 동일 분쇄 설정을 유지했을 때 물 처리 조건은 유속이 낮고 샷이 길어졌으며 TDS가 7.76%에서 9.05%로 증가했습니다.",
    },
    context: {
      bean: { roastLevels: ["dark"] },
      brew: {
        brewerTypes: ["other"],
        drinkStyles: ["hot"],
        doseGrams: { min: 18, max: 18, unit: "gram" },
        waterGrams: { min: 45, max: 45, unit: "beverage-gram" },
        temperatureCelsius: { min: 94, max: 94, unit: "celsius" },
      },
      grinder: {
        models: ["other"],
        burrTypes: ["flat-98mm-stock"],
      },
    },
    variables: [
      {
        name: "pregrindWaterMicrolitersPerGram",
        role: "intervention",
        value: { kind: "number", value: 10, unit: "microliter-per-gram" },
      },
      {
        name: "doseGrams",
        role: "control",
        value: { kind: "number", value: 18, unit: "gram" },
      },
      {
        name: "temperatureCelsius",
        role: "control",
        value: { kind: "number", value: 94, unit: "celsius" },
      },
      {
        name: "flowRateGramsPerSecond",
        role: "measurement",
        value: { kind: "text", value: "lower with 10 µL/g pregrind water" },
      },
      {
        name: "actualTimeSeconds",
        role: "measurement",
        value: { kind: "text", value: "longer shot time with pregrind water" },
      },
      {
        name: "beverageTdsPercent",
        role: "measurement",
        value: { kind: "text", value: "9.05% versus 7.76% untreated" },
      },
    ],
    outcome: {
      variable: "beverageTdsPercent",
      direction: "increase",
      value: { kind: "text", value: "approximately 16% relative concentration increase" },
      comparisonGroup: "10 µL/g pregrind water versus no treatment",
      sensoryDescription:
        "논문은 미분 재포함과 더 낮은 커피층 투과성을 가능한 기전으로 해석했습니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "indirect",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: [
        "프리프린트이며 독립 재현 연구가 아닙니다.",
        "다크 로스트 Temascaltepec와 고정된 에스프레소 장비·압력 조건입니다.",
        "V60의 중력식 유속, 종이 필터 막힘 또는 감각 품질을 직접 측정하지 않았습니다.",
        "TDS 증가는 분쇄도 설정 변화가 아니라 분쇄 전 수분과 정전기 완화에 따른 입도·잔류 변화입니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "paper",
      "preprint",
      "espresso",
      "dark-roast",
      "flow",
      "tds",
      "fines",
      "indirect-for-v60",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "obs:research-grind-static-1:light-espresso-no-clear-change",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "같은 커피의 라이트 로스트 에스프레소에서는 분쇄 전 물 또는 이온화가 추출 특성을 유의미하게 바꾸지 않았습니다.",
    excerpt: {
      locator: {
        page: 11,
        section: "The effect of charge mitigation on espresso quality",
        figure: "Figure S3 reference",
      },
      paraphrase:
        "본문은 라이트 로스트 Temascaltepec에서 외부 수분과 이온화 모두 에스프레소 추출 특성에 유의미한 변화를 보이지 않았다고 보고합니다.",
    },
    context: {
      bean: { roastLevels: ["light"] },
      brew: { brewerTypes: ["other"], drinkStyles: ["hot"] },
      grinder: {
        models: ["other"],
        burrTypes: ["flat-98mm-stock"],
      },
    },
    variables: [
      {
        name: "pregrindWaterMicrolitersPerGram",
        role: "intervention",
        value: { kind: "text", value: "extrinsic water tested" },
      },
      {
        name: "flowRateGramsPerSecond",
        role: "measurement",
        value: { kind: "text", value: "no significant brew-characteristic change reported" },
      },
    ],
    outcome: {
      variable: "flowRateGramsPerSecond",
      direction: "no-clear-change",
      comparisonGroup: "light roast with charge mitigation versus untreated",
      sensoryDescription:
        "다크 로스트 결과를 라이트 로스트 또는 모든 원두에 일괄 적용하지 않아야 한다는 제한 근거입니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "indirect",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: [
        "세부 수치는 보충자료 Figure S3에 있으며 본 Observation은 본문 보고를 요약합니다.",
        "단일 커피의 light roast 에스프레소 조건입니다.",
        "V60과 종이 필터 추출을 직접 시험하지 않았습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "paper",
      "preprint",
      "espresso",
      "light-roast",
      "limiting-evidence",
      "no-clear-change",
      "indirect-for-v60",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
