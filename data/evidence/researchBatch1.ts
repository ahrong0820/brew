import type { EvidenceSource } from "@/lib/types/evidence";

const sourceId = "paper:scientific-reports:2020:16450";

export const researchBatch1Sources = [
  {
    id: sourceId,
    type: "paper",
    title:
      "Brew temperature, at fixed brew strength and extraction, has little impact on the sensory profile of drip brew coffee",
    authors: [
      { name: "Mackenzie E. Batali", role: "author" },
      { name: "William D. Ristenpart", role: "author" },
      { name: "Jean-Xavier Guinard", role: "author" },
    ],
    publisher: "Nature Portfolio",
    publishedAt: "2020-10-05",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://www.nature.com/articles/s41598-020-73341-4",
    identifiers: [
      { scheme: "doi", value: "10.1038/s41598-020-73341-4" },
    ],
    status: "active",
    journal: "Scientific Reports",
    volume: "10",
    peerReviewStatus: "peer-reviewed",
    notes: [
      "87, 90, 93°C에서 TDS와 추출 수율을 독립적으로 통제한 자동 드립 감각 연구입니다.",
      "수동 V60에 직접 일반화하지 않고 간접 근거로 사용합니다.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
