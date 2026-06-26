import { eventBatch1Sources } from "@/data/evidence/eventBatch1";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const eventBatch1Observations = [
  {
    id: "obs:event-batch-1:framework",
    sourceId: eventBatch1Sources[0].id,
    kind: "recipe-specification",
    reviewStatus: "reviewed",
    summary: "공식 서비스 형식 관찰",
    excerpt: {
      locator: { page: 10, section: "Competition Summary" },
      paraphrase: "두 서비스의 운영 조건이 다릅니다.",
    },
    context: {},
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "recipe-example",
      reproducibility: "single-source",
      limitations: ["운영 규정 자료입니다."],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["event"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
