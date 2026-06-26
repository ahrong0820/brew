import type { EvidenceObservation } from "@/lib/types/evidence";

const sourceId = "paper:arxiv:2512.21528:v2";

export const researchPressureFlow1Observations = [
  {
    id: "obs:research-pressure-flow-1:nonlinear-pressure-flow",
    sourceId,
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary:
      "고정된 도징·분쇄·커피층 준비 조건의 에스프레소 실험에서 저압 구간은 압력 증가에 따라 유량이 증가했지만, 더 높은 압력에서는 유량이 포화되거나 감소하는 비선형 압력–유량 관계가 관찰됐습니다.",
    excerpt: {
      locator: {
        page: 8,
        section: "IV. Results",
        figure: "Figures 5-6",
      },
      paraphrase:
        "약 1-12 bar 범위에서 60회의 추출을 11개 압력 조건으로 비교했습니다. Figure 5는 약 5 bar 조건에서 컵 질량 증가가 가장 빨랐고 고압 구간에서는 압력 증가와 유량이 반대 방향으로 움직였음을 보여줍니다. Figure 6의 장기 유량은 저압의 Darcy형 증가 뒤 고압에서 포화되는 형태였습니다.",
    },
    context: {
      brew: {
        brewerTypes: ["other"],
        drinkStyles: ["hot"],
        doseGrams: { min: 18.45, max: 18.55, unit: "gram" },
        targetTimeSeconds: { min: 120, max: 120, unit: "second" },
      },
      grinder: {
        models: ["other"],
      },
    },
    variables: [
      {
        name: "brewPressureBar",
        role: "intervention",
        value: { kind: "range", min: 1, max: 12.5, unit: "bar" },
      },
      {
        name: "doseGrams",
        role: "control",
        value: { kind: "number", value: 18.5, unit: "gram" },
      },
      {
        name: "grinderSetting",
        role: "control",
        value: { kind: "text", value: "Fiorenzato F64 EVO setting 1.9" },
      },
      {
        name: "flowRateGramsPerSecond",
        role: "measurement",
        value: {
          kind: "text",
          value: "increased at low pressure, then saturated or decreased at higher pressure",
        },
      },
    ],
    outcome: {
      variable: "flowRateGramsPerSecond",
      direction: "optimum",
      comparisonGroup:
        "low-pressure Darcy-like region versus standard and higher espresso pressures",
      sensoryDescription:
        "압력을 높이는 조작이 유량을 단조롭게 높이지 않으며, 커피층 압축과 투과도 변화가 함께 작용한다는 조건부 유동 근거입니다.",
    },
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: [
        "단일 커피, 고정 분쇄 설정, 특정 상업용 머신과 바스켓 조건입니다.",
        "장기 유량 비교는 일반적인 음료 수율을 넘겨 약 120초 추출한 뒤 마지막 10초를 사용했습니다.",
        "고압 에스프레소의 기계적 압축 결과이며 V60의 정수압·중력식 유량에 직접 적용하지 않습니다.",
        "논문은 arXiv v2 프리프린트이며 독립 재현 연구가 아닙니다.",
        "약 5 bar 부근의 관측 최댓값을 다른 원두·분쇄도·도징의 보편 최적 압력으로 사용하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "paper",
      "preprint",
      "controlled-comparison",
      "espresso",
      "pressure",
      "flow",
      "poroelasticity",
      "indirect-for-v60",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "obs:research-pressure-flow-1:flow-and-solute-timing",
    sourceId,
    kind: "measured-association",
    reviewStatus: "reviewed",
    summary:
      "시간 분할 에스프레소 측정에서 총 음료 유량은 초기 이후 증가했지만 TDS는 약 20초 뒤 빠르게 감소했고, 용질 유량은 두 추세의 결합으로 약 30초 부근에서 최대가 됐습니다.",
    excerpt: {
      locator: {
        page: 9,
        section: "IV. Results",
        figure: "Figure 7",
      },
      paraphrase:
        "한 추출을 5초 간격 14개 분획으로 나누고 굴절계로 TDS를 측정했습니다. 초기의 가장 농축된 방울은 약 25% TDS였고 약 20초 안정 구간 뒤 감소하여 약 60초에는 0에 가까워졌습니다. 총 유량은 증가했지만 TDS를 곱한 용질 유량은 약 30초에서 정점을 보였습니다.",
    },
    context: {
      brew: {
        brewerTypes: ["other"],
        drinkStyles: ["hot"],
        doseGrams: { min: 18.45, max: 18.55, unit: "gram" },
        targetTimeSeconds: { min: 60, max: 100, unit: "second" },
      },
      grinder: {
        models: ["other"],
      },
    },
    variables: [
      {
        name: "actualTimeSeconds",
        role: "measurement",
        value: { kind: "range", min: 0, max: 100, unit: "second" },
      },
      {
        name: "flowRateGramsPerSecond",
        role: "measurement",
        value: { kind: "text", value: "rose after initial wetting toward a later plateau" },
      },
      {
        name: "beverageTdsPercent",
        role: "measurement",
        value: {
          kind: "text",
          value: "approximately 25% initially, declining toward zero around 60 seconds",
        },
      },
    ],
    outcome: {
      variable: "beverageTdsPercent",
      direction: "decrease",
      comparisonGroup: "successive five-second espresso fractions",
      sensoryDescription:
        "추출 시간이 길어질수록 음료 유량과 용질 전달이 같은 방향으로 움직이지 않으므로 시간이나 유량 하나만으로 추출 진행을 해석해서는 안 된다는 근거입니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "indirect",
      methodologicalStrength: "observational",
      reproducibility: "single-source",
      limitations: [
        "시간 분할 TDS 측정은 동일 장비·커피·에스프레소 레시피에 한정됩니다.",
        "초기 고농도 분획은 측정 범위에 맞추기 위해 증류수로 희석한 뒤 환산했습니다.",
        "약 30초 용질 유량 정점은 감각적 최적 종료 시간을 직접 측정한 결과가 아닙니다.",
        "60초 이후 결과는 일반적인 에스프레소 음료 범위를 넘는 장시간 추출입니다.",
        "V60의 푸어 구조·중력 유동·종이 필터 조건에 직접 일반화하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "paper",
      "preprint",
      "espresso",
      "flow",
      "tds",
      "solute-flux",
      "time-resolved",
      "indirect-for-v60",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
