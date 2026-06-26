import type { EvidenceSource } from "@/lib/types/evidence";

export const advisorSourcesJamesHoffmann = [
  {
    id: "expert:james-hoffmann:1oB1oDrDkHM",
    type: "expert",
    title: "A Better 1 Cup V60 Technique",
    authors: [
      {
        name: "James Hoffmann",
        role: "presenter",
      },
    ],
    publisher: "James Hoffmann",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://www.youtube.com/watch?v=1oB1oDrDkHM",
    identifiers: [
      {
        scheme: "youtube",
        value: "1oB1oDrDkHM",
      },
    ],
    status: "active",
    medium: "video",
    notes: [
      "YouTube 영상 페이지에서 제목을 직접 확인하고 James Hoffmann 공식 채널 페이지와 연결했습니다.",
      "현재 배치는 Source와 채널 provenance만 등록합니다.",
      "발언 타임스탬프, 화면 레시피 카드 또는 공식 설명란 위치를 직접 검증하기 전에는 Observation을 등록하지 않습니다.",
      "추천 계산과 CandidateRule에는 연결하지 않습니다.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
