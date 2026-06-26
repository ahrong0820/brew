import type { EvidenceSource } from "@/lib/types/evidence";

export const advisorSourceA = [
  {
    id: "expert:coffee-ad-astra:v60-2018",
    type: "expert",
    title: "How to Brew Better Coffee with a V60",
    authors: [
      {
        name: "Jonathan Gagné",
        role: "author",
        organization: "Coffee ad Astra",
      },
    ],
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
      organization: "Coffee ad Astra",
    },
    notes: [
      "저자 본인이 Coffee ad Astra에 직접 작성한 V60 기술 가이드입니다.",
      "자료 위치: 4.3 Grind Size and Uniformity의 미세화, 유속 저하와 V60 분쇄도 민감도 설명 부분입니다.",
      "적용 범위: 종이 필터를 사용하는 HOT V60 퍼콜레이션 추출이며 ICED·침지식·다른 드리퍼로 자동 일반화하지 않습니다.",
      "근거 분류: expert-opinion입니다. 저자의 실험·기술 해설에 기반하며 통제 실험 논문과 같은 방법론적 무게로 취급하지 않습니다.",
      "원문 페이지에는 2019-09-02 수정일이 표시되어 있습니다.",
      "검수: project-maintainer, 2026-06-26.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
