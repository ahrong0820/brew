import type { EvidenceObservation } from "@/lib/types/evidence";

export const researchBatch1Observations = [
  {
    id: "obs:research-batch-1:temperature",
    sourceId: "paper:scientific-reports:2020:16450",
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary: "통제된 드립 온도 비교 관찰",
    excerpt: {
      locator: { section: "Results" },
      paraphrase: "온도 조건의 감각 차이를 비교했습니다.",
    },
    context: {},
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "partially-applicable",
      methodologicalStrength: "controlled",
      reproducibility: "single-source",
      limitations: ["자동 드립 브루어 조건입니다."],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["temperature"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
