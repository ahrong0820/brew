import { equipmentData1Sources } from "@/data/evidence/equipmentData1";
import type { EvidenceObservation } from "@/lib/types/evidence";

const chartSource = equipmentData1Sources.find((source) =>
  source.id.includes("grind-setting-reference"),
);

if (!chartSource) {
  throw new Error("K-Ultra grind setting chart source is missing.");
}

export const equipmentNotes3 = [
  {
    id: "obs:manufacturer:1zpresso:k-ultra:pour-over-range",
    sourceId: chartSource.id,
    kind: "calibration",
    reviewStatus: "reviewed",
    summary:
      "1Zpresso 공식 K-Ultra 분쇄도 차트는 Siphon/Pour Over 범위를 다이얼 8.0~9.0으로 표시합니다.",
    excerpt: {
      locator: {
        figure: "K-Ultra Grind Setting Reference",
        paragraph: "Siphon/Pour Over band",
      },
      paraphrase:
        "공식 차트의 파란색 Siphon/Pour Over 구간은 다이얼 숫자 8에서 9까지입니다.",
    },
    context: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
      grinder: {
        models: ["1zpresso-k-ultra"],
        settingRange: { min: 8, max: 9, unit: "dial number" },
      },
    },
    variables: [
      {
        name: "grinderSetting",
        role: "recommendation",
        value: { kind: "range", min: 8, max: 9, unit: "dial number" },
      },
    ],
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "manufacturer-specification",
      reproducibility: "single-source",
      limitations: [
        "차트의 범위는 1Zpresso가 정의한 공식 영점, 즉 핸들 회전에 저항이 생기기 시작하는 지점을 전제로 합니다.",
        "사용자의 버 비접촉 영점은 공식 영점과 기준점이 다를 수 있으므로 8.0~9.0을 무보정으로 복사하지 않습니다.",
        "차트는 Siphon과 Pour Over를 하나의 넓은 범주로 묶은 시작 범위이며 V60 도징, 원두, 필터와 목표 시간별 단일 정답을 제공하지 않습니다.",
        "제조사 차트의 다이얼 숫자는 실제 입자의 평균 크기 또는 입도 분포를 뜻하지 않습니다.",
      ],
      reviewedBy: "project-maintainer",
      reviewedAt: "2026-06-27",
    },
    tags: [
      "manufacturer",
      "equipment",
      "k-ultra",
      "pour-over",
      "v60",
      "grind",
      "official-zero",
    ],
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  },
] as const satisfies readonly EvidenceObservation[];
