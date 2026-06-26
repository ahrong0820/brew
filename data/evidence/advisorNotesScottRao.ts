import { advisorSourcesScottRao } from "@/data/evidence/advisorSourcesScottRao";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const advisorNotesScottRao = [
  {
    id: "obs:expert-data-2:foundational-recipe-grind-first",
    sourceId: advisorSourcesScottRao[0].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "비슷한 배전도의 비결점 커피를 바꿀 때는 성공한 기본 레시피의 도징·비율·온도를 우선 고정하고 분쇄도를 먼저 조정하는 접근을 권고합니다.",
    excerpt: {
      locator: {
        paragraph: "fixed temperature, dose, ratio; adjust only grind when switching coffees",
      },
      paraphrase:
        "저자는 비슷한 배전도의 커피에서는 합리적인 온도, 도징과 비율을 상수로 두고 분쇄도 한 변수부터 조정하면 다이얼인이 단순하고 일관적이라고 설명합니다.",
    },
    context: {},
    variables: [
      {
        name: "doseGrams",
        role: "control",
        value: { kind: "text", value: "hold foundational dose constant" },
      },
      {
        name: "brewRatio",
        role: "control",
        value: { kind: "text", value: "hold foundational ratio constant" },
      },
      {
        name: "temperatureCelsius",
        role: "control",
        value: { kind: "text", value: "hold foundational temperature constant" },
      },
      {
        name: "grinderSetting",
        role: "intervention",
        value: { kind: "enum", value: "adjust-first" },
      },
    ],
    assessment: {
      extractionConfidence: "medium",
      directness: "partially-applicable",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "통제 실험이 아니라 저자의 운영 경험과 해석에 기반합니다.",
        "비슷한 배전도와 비결점 커피라는 전제가 필요하며 배전도나 결점이 달라지면 고정값 유지가 적절하지 않을 수 있습니다.",
        "미분이 매우 많은 에티오피아 커피와 디카페인은 충분히 굵게 갈 수 없을 때 도징 감소가 필요할 수 있다고 원문이 예외를 둡니다.",
        "필터와 에스프레소를 함께 다루는 일반 원칙이므로 개별 V60·ICED 조건에는 추가 검증이 필요합니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "expert",
      "expert-opinion",
      "dial-in",
      "grind-first",
      "claim-family:scott-rao-filter-grind-dial-in",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "obs:expert-data-2:target-time-over-nominal-setting",
    sourceId: advisorSourcesScottRao[0].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "특정 그라인더 숫자나 단일 미크론값보다 레시피별 목표 추출 시간에 맞춰 분쇄도를 조정하는 접근을 권고합니다.",
    excerpt: {
      locator: {
        paragraph: "target brew times rather than a setting or micron rating",
      },
      paraphrase:
        "저자는 버의 날카로움, 형상과 정렬 때문에 같은 모델도 최적 설정이 달라질 수 있어 숫자나 미크론 대신 목표 시간을 사용하라고 설명합니다.",
    },
    context: {},
    variables: [
      {
        name: "grinderSetting",
        role: "intervention",
        value: { kind: "text", value: "adjust to recipe-specific target time" },
      },
      {
        name: "actualTimeSeconds",
        role: "measurement",
        value: { kind: "text", value: "compare with target range" },
      },
      {
        name: "representativeMicrons",
        role: "condition",
        value: { kind: "text", value: "not sufficient as a universal target" },
      },
    ],
    outcome: {
      variable: "actualTimeSeconds",
      direction: "optimum",
      sensoryDescription:
        "목표 시간은 출발점이며 최종 다이얼인은 맛과 결점 여부를 함께 확인해야 합니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "partially-applicable",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "목표 시간 자체는 브루어, 도징, 비율과 레시피마다 달라 보편 상수가 아닙니다.",
        "시간이 맞아도 채널링이나 불균일 추출이 있으면 감각 결과가 좋다는 보장은 없습니다.",
        "2026년 같은 저자의 글이 이 주장을 확장하므로 두 글을 독립 전문가 두 명의 지지로 계산하면 안 됩니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "expert",
      "expert-opinion",
      "target-time",
      "grinder-setting",
      "claim-family:scott-rao-filter-grind-dial-in",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "obs:expert-data-2:grind-setting-context-dependence",
    sourceId: advisorSourcesScottRao[1].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "V60의 최적 분쇄 설정은 도징, 버 형상·정렬·날카로움, RPM, 원두별 미분량과 커피층 깊이에 따라 달라져 숫자나 PSD 피크 미크론만으로 이전하기 어렵습니다.",
    excerpt: {
      locator: {
        section: "The Grinder; The Dose; Burr geometry, alignment, and sharpness; Fines production",
      },
      paraphrase:
        "저자는 같은 명목 설정이라도 도징과 버 상태, RPM, 미분량이 유속을 바꾸며 PSD 피크 미크론은 미분 비율을 반영하지 못한다고 설명합니다.",
    },
    context: {
      brew: { brewerTypes: ["v60"] },
    },
    variables: [
      {
        name: "doseGrams",
        role: "condition",
        value: { kind: "text", value: "deeper bed generally needs coarser grind" },
      },
      {
        name: "grinderSetting",
        role: "condition",
        value: { kind: "text", value: "not transferable without grinder context" },
      },
      {
        name: "representativeMicrons",
        role: "condition",
        value: { kind: "text", value: "PSD peak omits fines percentage" },
      },
      {
        name: "flowRateGramsPerSecond",
        role: "measurement",
        value: { kind: "text", value: "strongly affected by fines and bed depth" },
      },
    ],
    outcome: {
      variable: "flowRateGramsPerSecond",
      direction: "association",
      sensoryDescription:
        "명목 분쇄도보다 실제 유속·추출 시간과 맛을 함께 사용해 다이얼인해야 한다는 조건부 지침입니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "정량 통제 실험이 아니라 저자의 기술 해설과 경험적 예시에 기반합니다.",
        "원문 예시 숫자는 특정 EK 설정과 도징 사례이며 다른 그라인더의 절대값으로 이전하지 않습니다.",
        "배전도, 산지, 디카페인과 원두 온도가 미분량에 미치는 방향은 별도 논문 근거와 함께 검토해야 합니다.",
        "2024년 같은 저자의 글을 확장한 계보이므로 독립성 가중치를 중복 부여하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "expert",
      "expert-opinion",
      "v60",
      "dose",
      "burr",
      "fines",
      "flow",
      "claim-family:scott-rao-filter-grind-dial-in",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "obs:expert-data-2:coarse-first-recovery",
    sourceId: advisorSourcesScottRao[1].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "초기 분쇄도는 예상보다 굵게 시작하고, 빠르고 약한 추출이면 점진적으로 미세화하며, 막힘·채널링·떫은맛이 나타나면 굵게 되돌리는 접근을 권고합니다.",
    excerpt: {
      locator: { section: "Dialing In" },
      paraphrase:
        "저자는 너무 미세하면 막힘과 채널링으로 떫고 불쾌해질 수 있으므로 굵게 시작하며, 빠른 추출은 다음 시도의 미세화 폭을 예측하기 쉽다고 설명합니다.",
    },
    context: {
      brew: { brewerTypes: ["v60"] },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "recommendation",
        value: { kind: "enum", value: "start-coarse-then-fine" },
      },
      {
        name: "actualTimeSeconds",
        role: "measurement",
        value: { kind: "text", value: "fast permits finer next step; stall requires coarser rollback" },
      },
      {
        name: "sensoryAstringency",
        role: "measurement",
        value: { kind: "text", value: "rollback trigger when increased" },
      },
    ],
    outcome: {
      variable: "sensoryAstringency",
      direction: "decrease",
      sensoryDescription:
        "막힘·채널링 또는 떫은맛 증가 시 미세화를 중단하고 한 단계 이상 굵게 되돌리는 안전 조건입니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "통제 비교가 아니라 전문가의 다이얼인 휴리스틱입니다.",
        "굵게 시작할 절대 위치와 조정 폭은 그라인더, 도징, 레시피와 목표 시간에 따라 달라집니다.",
        "빠른 추출이 항상 미세화만으로 해결되는 것은 아니며 푸어, 필터, 채널링과 물 조성도 확인해야 합니다.",
        "2024년 같은 저자의 굵게 시작하기 지침을 확장·재진술한 자료입니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: [
      "expert",
      "expert-opinion",
      "v60",
      "dial-in",
      "rollback",
      "astringency",
      "claim-family:scott-rao-filter-grind-dial-in",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
