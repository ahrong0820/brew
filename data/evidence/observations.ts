import type { EvidenceObservation } from "@/lib/types/evidence";

const registryTimestamp = "2026-06-26T00:00:00Z";

export const evidenceObservations = [
  {
    id: "obs:internal:initial-rule-set:baseline-v1",
    sourceId: "internal:initial-rule-set:v1",
    kind: "heuristic",
    reviewStatus: "reviewed",
    summary:
      "초기 추천 엔진은 맛 목표별 비율과 배전도·가공 방식·맛 목표별 온도 오프셋을 휴리스틱 시작점으로 사용합니다.",
    excerpt: {
      locator: { section: "lib/recommendation/baseEngine.ts" },
      paraphrase:
        "외부 자료 검증 전부터 운영하던 초기 규칙 집합을 추적 가능한 내부 관찰로 등록합니다.",
    },
    context: {},
    variables: [
      {
        name: "brewRatio",
        role: "recommendation",
        value: { kind: "range", min: 15, max: 16.5, unit: "water-per-coffee" },
      },
      {
        name: "temperatureCelsius",
        role: "recommendation",
        value: { kind: "range", min: 82, max: 96, unit: "celsius" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "heuristic",
      reproducibility: "single-source",
      limitations: [
        "현재 구현을 정확히 기술하지만 외부 근거의 과학적 강도를 의미하지 않습니다.",
        "배전도·가공 방식·맛 목표 간 상호작용을 충분히 설명하지 못합니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["baseline", "heuristic", "ratio", "temperature"],
    createdAt: registryTimestamp,
    updatedAt: registryTimestamp,
  },
  {
    id: "obs:manufacturer:holzklotz-e80:step-micron-table-v1",
    sourceId: "manufacturer:holzklotz-e80-micron-reference",
    kind: "calibration",
    reviewStatus: "reviewed",
    summary:
      "E80 제조사 표에서 Step가 증가할수록 표기 입도가 증가하며, 등록 범위는 5 Step 233μm부터 50 Step 1,245μm입니다.",
    excerpt: {
      locator: { section: "data/defaultCoffeeProfiles.ts" },
      paraphrase:
        "기본 그라인더 프로필에 입력된 제조사 Step-미크론 표와 선형 근사를 교정 관찰로 등록합니다.",
    },
    context: {
      grinder: {
        models: ["holzklotz-e80"],
        settingRange: { min: 5, max: 50, unit: "step" },
        representativeMicrons: { min: 233, max: 1245, unit: "micrometer" },
      },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "intervention",
        value: { kind: "range", min: 5, max: 50, unit: "step" },
      },
      {
        name: "representativeMicrons",
        role: "measurement",
        value: { kind: "range", min: 233, max: 1245, unit: "micrometer" },
      },
    ],
    outcome: {
      variable: "representativeMicrons",
      direction: "increase",
      sensoryDescription:
        "Step 증가에 따라 제조사 표기 입도가 증가합니다. 특정 레시피의 최적 Step를 의미하지는 않습니다.",
    },
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: [
        "제조사 표기 입도와 실제 분쇄 입자의 전체 분포는 동일하지 않을 수 있습니다.",
        "원본 문서 URL과 버전 정보는 후속 검수 단계에서 보강해야 합니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["grinder", "calibration", "manufacturer", "micron"],
    createdAt: registryTimestamp,
    updatedAt: registryTimestamp,
  },
] as const satisfies readonly EvidenceObservation[];
