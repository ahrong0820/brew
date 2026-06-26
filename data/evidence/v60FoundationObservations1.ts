import type { EvidenceObservation } from "@/lib/types/evidence";

const harioSourceId = "manufacturer:hario:v60-dripper-manual-global";
const expertSourceId = "expert:coffee-ad-astra:v60-2018";
const reviewedAt = "2026-06-27";
const createdAt = "2026-06-27T00:00:00Z";

export const v60FoundationObservations1 = [
  {
    id: "obs:manufacturer:hario-v60:serving-dose-reference",
    sourceId: harioSourceId,
    kind: "recipe-specification",
    reviewStatus: "reviewed",
    summary:
      "HARIO V60 공식 설명서는 1잔 약 120mL에 커피 10~12g과 중간보다 가는 분쇄를 기준 사용량으로 안내합니다.",
    excerpt: {
      locator: {
        page: 4,
        section: "How to Brew",
        paragraph: "one serving / medium-fine ground coffee",
      },
      paraphrase:
        "영문 설명서는 한 잔 120mL 기준으로 중간보다 가는 분쇄의 커피 10~12g을 사용하도록 안내합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
        doseGrams: { min: 10, max: 12, unit: "g" },
        waterGrams: { min: 120, max: 120, unit: "mL serving" },
      },
    },
    variables: [
      {
        name: "doseGrams",
        role: "recommendation",
        value: { kind: "range", min: 10, max: 12, unit: "g" },
      },
      {
        name: "waterGrams",
        role: "condition",
        value: { kind: "number", value: 120, unit: "mL serving" },
      },
      {
        name: "grinderSetting",
        role: "recommendation",
        value: { kind: "enum", value: "medium-fine" },
      },
    ],
    assessment: {
      extractionConfidence: "medium",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: [
        "설명서의 120mL는 1잔 제공량 표기이며 정확한 투입수량 또는 최종 음료 수율인지 구분되지 않습니다.",
        "따라서 10~12g 대 120mL를 앱의 정밀한 brew ratio로 직접 환산하지 않습니다.",
        "드리퍼 크기, 필터, 원두와 그라인더에 따른 세부 분쇄 숫자는 제공하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "manufacturer",
      "v60",
      "hot",
      "paper",
      "dose",
      "grind",
      "serving-reference",
    ],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "obs:manufacturer:hario-v60:bloom-circular-pour",
    sourceId: harioSourceId,
    kind: "recipe-specification",
    reviewStatus: "reviewed",
    summary:
      "HARIO V60 공식 설명서는 중심에서 바깥쪽으로 원을 그리며 가루를 적시고 약 30초 뜸을 들인 뒤 같은 원형 주입을 이어가도록 안내합니다.",
    excerpt: {
      locator: {
        page: 4,
        section: "How to Brew",
        paragraph:
          "moisten grounds / wait about 30 seconds / circular motion",
      },
      paraphrase:
        "커피층을 원형으로 고르게 적신 뒤 약 30초 기다리고, 종이 필터에 직접 물을 붓지 않으면서 중심부터 원을 그려 천천히 주입합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
    },
    variables: [
      {
        name: "bloomTimeSeconds",
        role: "recommendation",
        value: { kind: "number", value: 30, unit: "s" },
      },
      {
        name: "agitation",
        role: "recommendation",
        value: {
          kind: "text",
          value:
            "center-out circular wetting and slow circular main pour; avoid direct paper contact",
        },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: [
        "설명서는 블루밍 물량을 정량으로 제시하지 않습니다.",
        "본 추출의 세부 분할 횟수와 각 푸어 시작 시각은 제시하지 않습니다.",
        "원형 주입은 물줄기 높이와 유량까지 표준화한 지침이 아닙니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: ["manufacturer", "v60", "hot", "paper", "bloom", "pour"],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "obs:manufacturer:hario-v60:three-minute-ceiling",
    sourceId: harioSourceId,
    kind: "recipe-specification",
    reviewStatus: "reviewed",
    summary:
      "HARIO V60 공식 설명서는 전체 추출을 3분 이내에 마치도록 안내합니다.",
    excerpt: {
      locator: {
        page: 4,
        section: "How to Brew",
        paragraph: "brewing time should be within 3 minutes",
      },
      paraphrase:
        "설명서는 뜸 들이기를 포함한 V60 추출을 3분 이내로 마치도록 안내합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
        targetTimeSeconds: { max: 180, unit: "s" },
      },
    },
    variables: [
      {
        name: "targetTimeSeconds",
        role: "recommendation",
        value: { kind: "range", min: 0, max: 180, unit: "s" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: [
        "설명서는 목표 시간의 하한을 제공하지 않습니다.",
        "도징, 물량, 분쇄도와 필터별로 적정 시간이 달라질 수 있습니다.",
        "3분 이내는 감각 품질을 보장하는 단독 기준이 아닙니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: ["manufacturer", "v60", "hot", "paper", "target-time"],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "obs:expert-data-1:v60-ratio-range",
    sourceId: expertSourceId,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "Coffee ad Astra의 V60 가이드는 1:15~1:17 비율을 선호 범위로 제시하고 저자의 기본 선택으로 1:16을 사용합니다.",
    excerpt: {
      locator: {
        section: "4.2 Coffee to Water Ratio",
        paragraph: "1:15 to 1:17 / preference for 1:16",
      },
      paraphrase:
        "저자는 필터 커피의 실용적인 범위로 1:15~1:17을 사용하며 자신의 V60 기본 레시피에서는 1:16을 선택한다고 설명합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
        ratio: { min: 15, max: 17, unit: "water g per coffee g" },
      },
    },
    variables: [
      {
        name: "brewRatio",
        role: "recommendation",
        value: {
          kind: "range",
          min: 15,
          max: 17,
          unit: "water g per coffee g",
        },
      },
      {
        name: "brewRatio",
        role: "recommendation",
        value: {
          kind: "number",
          value: 16,
          unit: "water g per coffee g",
        },
      },
    ],
    assessment: {
      extractionConfidence: "medium",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "통제 실험에서 단일 최적 비율을 확정한 결과가 아니라 저자의 기술 해설과 선호 범위입니다.",
        "원두, 배전도, 물과 목표 농도에 따라 범위 안에서 다이얼인이 필요합니다.",
        "1:16은 균형형 시작점이며 모든 맛 목표의 정답으로 취급하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: ["expert", "v60", "hot", "paper", "ratio", "foundation"],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "obs:expert-data-1:v60-three-x-bloom-workflow",
    sourceId: expertSourceId,
    kind: "recipe-specification",
    reviewStatus: "reviewed",
    summary:
      "Coffee ad Astra의 기준 V60 예시는 22g 커피에 66g 물로 블루밍하고 30초부터 본 추출을 시작해 총 352g을 사용하는 1:16 구조입니다.",
    excerpt: {
      locator: {
        section: "7. The Full Procedure",
        paragraph: "22 g dose / 66 g bloom / wait until 0:30 / 352 g total",
      },
      paraphrase:
        "22g 도징에서 원두량의 3배인 66g으로 블루밍하고 30초에 본 주입을 시작하며, 최종 352g까지 두 번의 본 주입으로 완성합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
        doseGrams: { min: 22, max: 22, unit: "g" },
        ratio: { min: 16, max: 16, unit: "water g per coffee g" },
        waterGrams: { min: 352, max: 352, unit: "g" },
      },
    },
    variables: [
      {
        name: "doseGrams",
        role: "condition",
        value: { kind: "number", value: 22, unit: "g" },
      },
      {
        name: "bloomWaterGrams",
        role: "recommendation",
        value: { kind: "number", value: 66, unit: "g" },
      },
      {
        name: "bloomRatio",
        role: "recommendation",
        value: {
          kind: "number",
          value: 3,
          unit: "water g per coffee g",
        },
      },
      {
        name: "bloomTimeSeconds",
        role: "recommendation",
        value: { kind: "number", value: 30, unit: "s" },
      },
      {
        name: "pourCount",
        role: "condition",
        value: { kind: "number", value: 2, unit: "main pours" },
      },
      {
        name: "pourTargetWaterGrams",
        role: "recommendation",
        value: { kind: "number", value: 352, unit: "g" },
      },
    ],
    assessment: {
      extractionConfidence: "medium",
      directness: "direct",
      methodologicalStrength: "recipe-example",
      reproducibility: "single-source",
      limitations: [
        "22g·352g의 구체적 수치는 저자의 장비와 레시피 예시입니다.",
        "두 번째 본 주입은 고정 시각이 아니라 커피층의 수위가 가까워지는 조건으로 시작하므로 임의의 타임스탬프를 만들지 않습니다.",
        "3배 블루밍과 30초는 HARIO의 30초 지침과 결합해 기준화할 수 있지만 푸어 횟수는 별도 선택입니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: ["expert", "v60", "hot", "paper", "bloom", "ratio", "pour"],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "obs:expert-data-1:v60-typical-contact-time",
    sourceId: expertSourceId,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "Coffee ad Astra의 V60 가이드는 기준 절차의 일반적인 총 추출 시간을 약 2분 30초~3분 30초로 설명합니다.",
    excerpt: {
      locator: {
        section: "7. The Full Procedure",
        paragraph: "typical total brew time around 2:30 to 3:30",
      },
      paraphrase:
        "저자는 해당 V60 절차가 보통 약 150~210초에 끝나지만 원두와 분쇄 조건에 따라 달라진다고 설명합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
        targetTimeSeconds: { min: 150, max: 210, unit: "s" },
      },
    },
    variables: [
      {
        name: "targetTimeSeconds",
        role: "measurement",
        value: { kind: "range", min: 150, max: 210, unit: "s" },
      },
    ],
    assessment: {
      extractionConfidence: "medium",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "목표 시간은 22g·1:16 예시와 저자의 장비 조건에서 관찰한 일반 범위입니다.",
        "필터, 그라인더, 미분량과 도징이 시간을 바꿉니다.",
        "시간이 범위 안이어도 감각 결과와 채널링 여부를 함께 확인해야 합니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: ["expert", "v60", "hot", "paper", "target-time"],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "obs:expert-data-1:v60-temperature-range",
    sourceId: expertSourceId,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "Coffee ad Astra의 V60 가이드는 일반적인 권장 물 온도를 91~94℃로 정리하면서 V60의 열 손실 때문에 저자는 가능한 높은 주전자 온도를 선호합니다.",
    excerpt: {
      locator: {
        section: "4.1 Water Temperature",
        paragraph:
          "most recommendations 91-94 C / highest possible kettle temperature",
      },
      paraphrase:
        "저자는 많은 권고가 91~94℃에 모인다고 정리하고, V60에서는 슬러리 온도가 크게 떨어지므로 자신의 절차에서는 주전자 최고 온도를 사용한다고 설명합니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
        temperatureCelsius: {
          min: 91,
          max: 94,
          unit: "°C recommendation range",
        },
      },
    },
    variables: [
      {
        name: "temperatureCelsius",
        role: "recommendation",
        value: { kind: "range", min: 91, max: 94, unit: "°C" },
      },
    ],
    assessment: {
      extractionConfidence: "low",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "저자는 해당 절에서 물 온도에 관한 견고한 데이터가 제한적이라고 명시합니다.",
        "91~94℃는 일반 권고의 요약이며 배전도별 정확한 숫자 매핑을 검증하지 않습니다.",
        "주전자 설정 온도와 실제 슬러리 온도는 드리퍼 예열, 주입과 환경에 따라 다릅니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "expert",
      "v60",
      "hot",
      "paper",
      "temperature",
      "limited-data",
    ],
    createdAt,
    updatedAt: createdAt,
  },
] as const satisfies readonly EvidenceObservation[];
