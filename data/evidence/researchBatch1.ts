import type { EvidenceSource } from "@/lib/types/evidence";

const sourceId = "paper:scientific-reports:2020:16450";

export const researchBatch1Sources = [
  {
    id: sourceId,
    type: "paper",
    title: "Drip brew temperature sensory study",
    authors: [
      { name: "Mackenzie E. Batali", role: "author" },
      { name: "William D. Ristenpart", role: "author" },
      { name: "Jean-Xavier Guinard", role: "author" },
    ],
    publisher: "Nature Portfolio",
    publishedAt: "2020-10-05",
    accessedAt: "2026-06-26",
    identifiers: [{ scheme: "internal", value: "scientific-reports-2020-16450" }],
    status: "active",
    journal: "Scientific Reports",
    volume: "10",
    peerReviewStatus: "peer-reviewed",
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
