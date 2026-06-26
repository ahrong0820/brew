import { equipmentData1Sources } from "@/data/evidence/equipmentData1";
import type { EvidenceObservation } from "@/lib/types/evidence";

export const equipmentNotes2 = [
  {
    id: "obs:equipment-data-1:zero-reference",
    sourceId: equipmentData1Sources[0].id,
    kind: "calibration",
    reviewStatus: "reviewed",
    summary:
      "공식 영점은 완전히 조인 지점이 아니라 핸들이 저항을 받으며 회전하기 시작하는 지점입니다.",
    excerpt: {
      locator: { section: "Adjustment Dial Calibration", paragraph: "Zero Point" },
      paraphrase:
        "매뉴얼은 과도하게 조이지 말고 핸들 회전에 저항이 생기는 지점을 영점으로 정의합니다.",
    },
    context: {
      grinder: { models: ["1zpresso-k-ultra"] },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "recommendation",
        value: { kind: "enum", value: "resistance-start-zero" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: [
        "사용자의 비접촉 영점 방식과 공식 저항 시작 영점은 기준점이 다를 수 있습니다.",
        "조임 힘에 따라 표시 영점이 두 클릭 이상 달라질 수 있습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-26",
    },
    tags: ["equipment", "k-ultra", "zero-reference"],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
