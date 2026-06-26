import { originVarietySources1 } from "@/data/evidence/originVarietySources1";
import type { EvidenceObservation } from "@/lib/types/evidence";

const reviewedAt = "2026-06-26";
const timestamp = "2026-06-26T00:00:00Z";

export const originVarietyObservations1 = [
  {
    id: "obs:wcr-varieties-1:catalog-context-limitations",
    sourceId: originVarietySources1[0].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "WCR 품종 카탈로그의 품질·수확량 평가는 이상적 조건의 상대적 참고값이며 환경, 고도, 토양 영양, 날씨, 수령과 농장 관리에 따라 달라질 수 있습니다.",
    excerpt: {
      locator: {
        section: "Using the catalog",
        paragraph:
          "environment, altitude, soil nutrition, weather, tree age, and farm management affect yield, quality, and health",
      },
      paraphrase:
        "카탈로그는 품종 성능을 절대값으로 제시하지 않으며, 재배 환경과 관리 조건을 함께 고려해 기준 품종 대비 상대적으로 해석해야 한다고 설명합니다.",
    },
    context: {},
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "농업·품종 선택용 카탈로그의 해석 지침이며 볶은 커피의 추출 실험이 아닙니다.",
        "카탈로그는 계속 갱신되는 living document이므로 향후 분류가 바뀔 수 있습니다.",
        "품질과 수확량 평가는 특정 농장의 실제 결과를 보장하는 절대값이 아닙니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "world-coffee-research",
      "variety-catalog",
      "methodology",
      "agronomy",
      "fact",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:wcr-varieties-1:bourbon-altitude-quality",
    sourceId: originVarietySources1[1].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "WCR 카탈로그는 Bourbon의 고지대 품질 잠재력을 Very Good, 최적 고도 범주를 High로 분류합니다.",
    excerpt: {
      locator: {
        section: "Quality potential at high altitude; Optimal Altitude",
        paragraph: "Bourbon ratings: Very Good; High",
      },
      paraphrase:
        "Bourbon 페이지는 높은 고도에서의 품질 잠재력을 두 번째로 높은 등급으로, 품질과 농업 성능이 최대화되는 고도 범주를 높은 수준으로 표시합니다.",
    },
    context: {
      bean: {
        varieties: ["Bourbon"],
      },
    },
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "High 고도 범주의 미터 기준은 위도에 따라 달라 단일 절대 고도로 환산하지 않습니다.",
        "품질 잠재력은 재배 단계의 상대 분류이며 특정 향미나 추출 용해도를 직접 뜻하지 않습니다.",
        "배전도, 가공 방식, 생두 밀도와 로스팅 후 경과일을 통제한 추출 연구가 아닙니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "world-coffee-research",
      "variety",
      "bourbon",
      "altitude",
      "quality-potential",
      "fact",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:wcr-varieties-1:sl28-altitude-quality-distribution",
    sourceId: originVarietySources1[2].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "WCR 카탈로그는 SL28의 고지대 품질 잠재력을 Exceptional, 최적 고도 범주를 Medium·High로 분류하며 Kenya, Malawi, Uganda, Zimbabwe에서 흔하다고 설명합니다.",
    excerpt: {
      locator: {
        section: "Summary; Quality potential at high altitude; Optimal Altitude",
        paragraph:
          "SL28 ratings and distribution: Exceptional; Medium, High; Kenya, Malawi, Uganda, Zimbabwe",
      },
      paraphrase:
        "SL28 페이지는 고지대 품질 잠재력을 최상 등급으로 표시하고, 위도에 따라 중고도 이상이 적합한 범주라고 제시하며 동아프리카와 남동부 아프리카 여러 국가의 재배 분포를 열거합니다.",
    },
    context: {
      bean: {
        varieties: ["SL28"],
      },
    },
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "국가 목록은 흔한 재배 분포를 뜻하며 해당 국가의 모든 커피가 SL28이라는 의미가 아닙니다.",
        "최적 고도 임계값은 위도별로 다르며 단일 고도 범위로 축약하지 않습니다.",
        "Exceptional 분류는 농업·품종 카탈로그의 품질 잠재력이며 추출 온도나 분쇄도 조정 근거가 아닙니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "world-coffee-research",
      "variety",
      "sl28",
      "altitude",
      "quality-potential",
      "distribution",
      "fact",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:wcr-varieties-1:caturra-altitude-quality",
    sourceId: originVarietySources1[3].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "WCR 카탈로그는 Caturra의 고지대 품질 잠재력을 Good, 최적 고도 범주를 High로 분류합니다.",
    excerpt: {
      locator: {
        section: "Quality potential at high altitude; Optimal Altitude",
        paragraph: "Caturra ratings: Good; High",
      },
      paraphrase:
        "Caturra 페이지는 높은 고도에서의 품질 잠재력을 Good으로, 품질과 농업 성능을 함께 고려한 최적 고도 범주를 High로 표시합니다.",
    },
    context: {
      bean: {
        varieties: ["Caturra"],
      },
    },
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "High 고도 범주의 미터 기준은 위도에 따라 달라 단일 절대 고도로 환산하지 않습니다.",
        "Good은 카탈로그의 상대 품질 잠재력 등급이며 개별 로트의 감각 품질을 보장하지 않습니다.",
        "배전과 추출 조건에 대한 직접 지침이 아니므로 추천 계산에 연결하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "world-coffee-research",
      "variety",
      "caturra",
      "altitude",
      "quality-potential",
      "fact",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "obs:wcr-varieties-1:caturra-lineage-origin-history",
    sourceId: originVarietySources1[3].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "WCR 카탈로그는 Caturra를 Bourbon의 자연 돌연변이로 설명하며, 브라질 Minas Gerais에서 1915~1918년 사이 발견된 뒤 Central America에 널리 보급됐다고 기록합니다.",
    excerpt: {
      locator: {
        section: "Lineage; History",
        paragraph:
          "natural mutation of Bourbon; discovered in Minas Gerais between 1915 and 1918; later common in Central America",
      },
      paraphrase:
        "Caturra의 계통은 Bourbon과 연결되며 브라질에서 발견·선발된 후 Guatemala를 거쳐 Costa Rica, Honduras, Panama 등 Central America로 확산됐다는 역사적 설명입니다.",
    },
    context: {
      bean: {
        originCountries: ["brazil", "central-america"],
        originGroups: ["brazil", "latin-america"],
        originRegions: ["Minas Gerais"],
        varieties: ["Caturra", "Bourbon"],
      },
    },
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "indirect",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "발견지와 확산 역사를 기록한 사실이며 현재 개별 로트의 생산지를 대신하지 않습니다.",
        "계통 관계만으로 두 품종의 향미나 추출 특성이 동일하다고 판단할 수 없습니다.",
        "Central America의 국가별 보급 시점과 현재 재배 비중은 별도 공식 자료가 필요합니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt,
    },
    tags: [
      "world-coffee-research",
      "variety",
      "caturra",
      "bourbon",
      "lineage",
      "minas-gerais",
      "central-america",
      "fact",
      "not-extraction-rule",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
] as const satisfies readonly EvidenceObservation[];
