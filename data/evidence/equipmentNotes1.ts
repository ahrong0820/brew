import { equipmentData1Sources } from "@/data/evidence/equipmentData1";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const equipmentNotes1 = [
  {
    id: "obs:equipment-data-1:adjustment",
    sourceId: equipmentData1Sources[0].id,
    kind: "calibration",
    reviewStatus: "reviewed",
    summary: "공식 조절 구조 관찰",
    excerpt: {
      locator: { section: "User Instructions" },
      paraphrase: "설정 숫자와 조절 방향을 기록했습니다.",
    },
    context: {},
    variables: [],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: ["장비 교정 자료입니다."],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["equipment"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
