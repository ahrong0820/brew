import type { EvidenceObservation } from "@/lib/types/evidence";

export const researchBatch1B = [
  {
    id: "obs:research-batch-1:tds",
    sourceId: "paper:scientific-reports:2020:16450",
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary: "음료 농도가 높을수록 일부 강한 감각 속성이 증가했습니다.",
    excerpt: {
      locator: { section: "Results" },
      paraphrase: "감각 속성의 강도는 음료 농도 변화와 연관됐습니다.",
    },
    context: {},
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "partially-applicable",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: ["자동 드립 조건입니다."],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["tds"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
