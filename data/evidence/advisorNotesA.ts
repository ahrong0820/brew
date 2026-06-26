import { advisorSourceA } from "@/data/evidence/advisorSourceA";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const advisorNotesA = [
  {
    id: "obs:expert-data-1:v60-grind-sensitivity",
    sourceId: advisorSourceA[0].id,
    kind: "expert-guidance",
    reviewStatus: "reviewed",
    summary:
      "V60에서는 더 미세한 분쇄가 추출 속도를 높이는 동시에 유속을 늦춰 농도와 추출 수율을 함께 높일 수 있습니다.",
    excerpt: {
      locator: { section: "4.3 Grind Size and Uniformity" },
      paraphrase:
        "저자는 미세 분쇄가 표면적을 늘리고 필터와 커피층의 유속도 늦추기 때문에 V60 결과가 분쇄도에 민감하다고 설명합니다.",
    },
    context: {
      brew: { brewerTypes: ["v60"], drinkStyles: ["hot"] },
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
        value: { kind: "text", value: "longer flow time expected" },
      },
    ],
    outcome: {
      variable: "extractionYieldPercent",
      direction: "increase",
      sensoryDescription:
        "미세화는 접촉과 유속 효과가 결합되어 추출 수율과 음료 강도를 높일 수 있습니다.",
    },
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "expert-opinion",
      reproducibility: "single-source",
      limitations: [
        "통제 실험 논문이 아니라 저자의 기술 해설과 경험에 기반합니다.",
        "미분량, 버 형상과 정렬 상태에 따라 같은 명목 분쇄도의 유속이 달라질 수 있습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["expert", "v60", "grind", "flow", "extraction"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
