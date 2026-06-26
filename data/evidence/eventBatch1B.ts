import { eventBatch1Sources } from "@/data/evidence/eventBatch1";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const eventBatch1B = [
  {
    id: "obs:event-batch-1:final-ranking",
    sourceId: eventBatch1Sources[1].id,
    kind: "recipe-specification",
    reviewStatus: "reviewed",
    summary:
      "2025 최종 1위 기록은 Panama Gesha Natural 원두와 Open 367, Compulsory 152, 총점 519를 포함합니다.",
    excerpt: {
      locator: { page: 1, table: "Final Round" },
      paraphrase:
        "공식 최종 순위표의 1위 행에서 참가자, 점수와 사용 원두 정보를 확인했습니다.",
    },
    context: {
      bean: {
        originCountries: ["other"],
        processes: ["natural"],
        varieties: ["Gesha"],
      },
    },
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "recipe-example",
      reproducibility: "single-source",
      limitations: [
        "순위표에는 상세 추출 레시피와 설계 이유가 포함되지 않습니다.",
        "우승 결과만으로 원두나 공정의 인과적 우수성을 추론하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["event", "final-ranking", "gesha", "natural"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
