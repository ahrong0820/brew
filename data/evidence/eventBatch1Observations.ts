import { eventBatch1Sources } from "@/data/evidence/eventBatch1";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const eventBatch1Observations = [
  {
    id: "obs:event-batch-1:framework",
    sourceId: eventBatch1Sources[0].id,
    kind: "recipe-specification",
    reviewStatus: "reviewed",
    summary:
      "Open Service와 Compulsory Service는 원두 선택, 발표 여부와 제한 시간이 다른 평가 환경입니다.",
    excerpt: {
      locator: { page: 10, section: "Competition Summary" },
      paraphrase:
        "제공 원두만 사용하는 서비스와 참가자가 원두를 선택하고 발표하는 서비스가 분리되어 있습니다.",
    },
    context: {},
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "recipe-example",
      reproducibility: "single-source",
      limitations: [
        "대회 운영 규정이며 특정 추출 변수가 더 좋은 맛을 만든다는 근거가 아닙니다.",
        "제공 원두 서비스도 장비와 추출 전략은 참가자마다 다릅니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["event", "open-service", "provided-coffee-service"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
