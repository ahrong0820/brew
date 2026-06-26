import type { EvidenceSource } from "@/lib/types/evidence";

export const eventBatch1Sources = [
  {
    id: "competition:wbrc:2025:official-rules",
    type: "competition",
    title: "2025 World Brewers Cup Official Rules and Regulations",
    authors: [
      {
        name: "WCC Rules and Regulations Committee",
        role: "author",
        organization: "World Coffee Events",
      },
    ],
    publisher: "World Coffee Championships",
    publishedAt: "2025-01-01",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl:
      "https://wcc.coffee/s/2025-World-Brewers-Cup-Rules-and-Regulations-1.pdf",
    identifiers: [
      {
        scheme: "competition-entry",
        value: "wbrc-2025-official-rules",
      },
    ],
    status: "active",
    competition: {
      name: "World Brewers Cup",
      year: 2025,
      division: "world",
    },
    notes: [
      "대회 형식과 서비스 조건을 설명하는 공식 1차 자료입니다.",
      "규정은 레시피 우수성의 인과 근거가 아니라 관찰 자료의 해석 범위를 정하는 데 사용합니다.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
