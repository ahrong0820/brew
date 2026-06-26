import { advisorSourceA } from "@/data/evidence/advisorSourceA";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const advisorNotesA = [
  {
    id: "obs:expert-data-1:v60-grind-sensitivity",
    sourceId: advisorSourceA[0].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "HOT V60에서는 미세화가 입자 표면적을 늘리고 커피층의 유속을 늦춰 음료 강도와 추출 수율을 높이는 방향으로 작용할 수 있습니다.",
    excerpt: {
      locator: {
        section: "4.3 Grind Size and Uniformity",
        paragraph: "finer grinds, flow through the coffee bed, V60 grind sensitivity",
      },
      paraphrase:
        "저자는 미세 분쇄가 확산 가능한 표면적을 늘리고 필터와 커피층의 흐름도 늦추므로 V60 결과가 분쇄도에 민감하다고 설명합니다.",
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
        name: "grinderSetting",
        role: "intervention",
        value: { kind: "enum", value: "finer" },
      },
      {
        name: "actualTimeSeconds",
        role: "measurement",
        value: {
          kind: "text",
          value: "longer drawdown expected when other conditions are comparable",
        },
      },
    ],
    outcome: {
      variable: "extractionYieldPercent",
      direction: "increase",
      sensoryDescription:
        "미세화는 표면적 증가와 유속 저하가 결합되어 추출 수율과 음료 강도를 높이는 방향으로 작용할 수 있습니다.",
    },
    assessment: {
      extractionConfidence: "medium",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "통제 실험 논문이 아니라 저자의 기술 해설, 관찰과 해석에 기반합니다.",
        "이 Observation은 종이 필터 HOT V60에 직접 적용되며 ICED, 침지식 또는 다른 드리퍼에는 별도 검증 없이 일반화하지 않습니다.",
        "미분량, 버 형상, 정렬, 도징, 교반과 필터 상태가 유속 및 추출 결과를 함께 바꿀 수 있습니다.",
        "미세화가 항상 더 나은 감각 결과를 뜻하지 않으며 막힘, 채널링 또는 떫은맛 증가 시 제한 근거가 필요합니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["expert", "expert-opinion", "v60", "hot", "grind", "flow", "extraction"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
