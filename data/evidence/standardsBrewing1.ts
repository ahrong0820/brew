import type { EvidenceSource } from "@/lib/types/evidence";

export const standardsBrewing1Sources = [
  {
    id: "expert:sca:standard-310-2021-home-brewers",
    type: "expert",
    title: "SCA Standard 310-2021 — Home Coffee Brewers: Specifications and Test Methods",
    authors: [
      {
        name: "Specialty Coffee Association Standards Development Panel",
        role: "author",
        organization: "Specialty Coffee Association",
      },
    ],
    publisher: "Specialty Coffee Association",
    publishedAt: "2022",
    accessedAt: "2026-06-27",
    language: "en",
    canonicalUrl:
      "https://sca.coffee/research/coffee-standards/310-home-brewers",
    identifiers: [
      {
        scheme: "internal",
        value: "SCA-310-2021",
      },
      {
        scheme: "url",
        value: "https://bit.ly/3PmBebo",
      },
    ],
    status: "active",
    medium: "article",
    expertProfile: {
      credentials: [
        "SCA consensus standard",
        "Standards Development Panel approved",
      ],
      organization: "Specialty Coffee Association",
    },
    notes: [
      "SCA 공식 Coffee Standards 페이지에 게시된 Home Coffee Brewers 표준입니다.",
      "표준 번호는 310-2021이며 문서에는 © 2022 Specialty Coffee Association으로 표기됩니다.",
      "표준은 전기식 필터 커피 가정용 브루어의 규격과 시험법을 다루며 수동 푸어오버는 적용 범위에서 명시적으로 제외합니다.",
      "55 g/kg 비율과 90~96°C는 규격 시험 조건이므로 HOT V60의 직접 최적값으로 단정하지 않습니다.",
    ],
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
