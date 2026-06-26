import type { EvidenceSource } from "@/lib/types/evidence";

const timestamp = "2026-06-26T00:00:00Z";

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
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "competition:wbrc:2025:final-rankings",
    type: "competition",
    title: "2025 World Brewers Cup Final Rankings",
    authors: [
      {
        name: "World Coffee Championships",
        role: "presenter",
        organization: "World Coffee Events",
      },
    ],
    publisher: "World Coffee Championships",
    publishedAt: "2025-05-17",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl:
      "https://wcc.coffee/s/2025-World-Brewers-Cup-Final-Rankings-Cropped.pdf",
    identifiers: [
      {
        scheme: "competition-entry",
        value: "wbrc-2025-final-rankings",
      },
    ],
    status: "active",
    competition: {
      name: "World Brewers Cup",
      year: 2025,
      division: "world",
      round: "final",
    },
    notes: [
      "최종 순위, Open Service와 Compulsory Service 점수, 사용 원두 정보를 제공하는 공식 표입니다.",
      "순위와 원두 선택은 사용 사례로 기록하며 특정 변수가 우수하다는 인과 근거로 사용하지 않습니다.",
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
] as const satisfies readonly EvidenceSource[];
