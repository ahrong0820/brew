import type { EvidenceObservation } from "@/lib/types/evidence";

export const researchBatch1Observations = [
  {
    id: "obs:research-batch-1:temperature",
    sourceId: "paper:scientific-reports:2020:16450",
    kind: "controlled-comparison",
    reviewStatus: "reviewed",
    summary: "동일한 TDS와 추출 수율에서는 시험한 온도 범위의 전체 감각 차이가 작았습니다.",
    excerpt: {
      locator: { section: "Results" },
      paraphrase: "훈련 패널의 다변량 분석에서 온도 주효과가 확인되지 않았습니다.",
    },
    context: {
      brew: {
        brewerTypes: ["other"],
        drinkStyles: ["hot"],
      },
    },
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
