import type { EvidenceSource } from "@/lib/types/evidence";

export const advisorSourcesTetsuKasuya = [
  {
    id: "expert:tetsu-kasuya:wmCW8xSWGZY",
    type: "expert",
    title: "How to Brew Coffee Using the 4:6 Method",
    authors: [
      {
        name: "Tetsu Kasuya",
        role: "presenter",
      },
    ],
    publisher: "Tetsu Kasuya",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://www.youtube.com/watch?v=wmCW8xSWGZY",
    identifiers: [
      {
        scheme: "youtube",
        value: "wmCW8xSWGZY",
      },
    ],
    status: "active",
    medium: "video",
    expertProfile: {
      credentials: ["2016 World Brewers Cup Champion"],
      organization: "PHILOCOFFEA",
    },
    notes: [
      "Tetsu Kasuya의 공식 PHILOCOFFEA 사이트가 4:6 brewing method 안내 영역에 이 YouTube ID를 직접 임베드하고 있습니다.",
      "YouTube @TetsuKasuya 채널 페이지의 채널명과 PHILOCOFFEA 공식 사이트의 창립자 정보를 함께 확인했습니다.",
      "현재 배치는 Source와 공식 채널 provenance만 등록합니다.",
      "영상 발언 타임스탬프, 챕터, 화면 레시피 카드 또는 제작자 설명란을 직접 검증하기 전에는 Observation을 등록하지 않습니다.",
      "추천 계산과 CandidateRule에는 연결하지 않습니다.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
