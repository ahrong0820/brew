import type { EvidenceSource } from "@/lib/types/evidence";

export const advisorSourceA = [
  {
    id: "expert:coffee-ad-astra:v60-2018",
    type: "expert",
    title: "How to Brew Better Coffee with a V60",
    authors: [{ name: "Jonathan Gagné", role: "author" }],
    publisher: "Coffee ad Astra",
    publishedAt: "2018-11-30",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://coffeeadastra.com/2018/11/30/brewing-better-coffee/",
    identifiers: [
      {
        scheme: "url",
        value: "https://coffeeadastra.com/2018/11/30/brewing-better-coffee/",
      },
    ],
    status: "active",
    medium: "article",
    expertProfile: {
      credentials: ["The Physics of Filter Coffee author"],
    },
    notes: [
      "저자가 직접 작성한 기술적 V60 가이드입니다.",
      "일부 내용은 저자의 실험과 해석이며 통제 연구와 구분합니다.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
