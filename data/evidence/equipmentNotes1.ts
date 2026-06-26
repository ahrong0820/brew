import { equipmentData1Sources } from "@/data/evidence/equipmentData1";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const equipmentNotes1 = [
  {
    id: "obs:equipment-data-1:adjustment",
    sourceId: equipmentData1Sources[0].id,
    kind: "calibration",
    reviewStatus: "reviewed",
    summary:
      "K-Ultra는 숫자가 높아질수록 굵어지고, 한 바퀴는 100클릭이며 클릭당 버 이동량은 0.02mm입니다.",
    excerpt: {
      locator: { section: "User Instructions", paragraph: "1-3" },
      paraphrase:
        "공식 매뉴얼은 높은 숫자가 더 굵은 방향이고 클릭당 버 이동량이 20µm라고 설명합니다.",
    },
    context: {
      grinder: { models: ["1zpresso-k-ultra"] },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "condition",
        value: { kind: "text", value: "100 clicks per rotation" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: [
        "20µm는 버 이동량이며 실제 입자의 평균 크기나 분포 폭을 뜻하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["equipment", "k-ultra", "adjustment"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
