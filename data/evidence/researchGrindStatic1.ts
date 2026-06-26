import type { EvidenceSource } from "@/lib/types/evidence";

export const researchGrindStatic1Sources = [
  {
    id: "paper:arxiv:2312.03103:v3",
    type: "paper",
    title: "Chemical strategies to mitigate electrostatic charging during coffee grinding",
    authors: [
      { name: "Joshua Méndez Harper", role: "author" },
      { name: "Christopher H. Hendon", role: "author" },
    ],
    publisher: "arXiv",
    publishedAt: "2023-12-19",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://arxiv.org/abs/2312.03103",
    identifiers: [
      { scheme: "url", value: "https://arxiv.org/abs/2312.03103" },
    ],
    status: "active",
    journal: "Preprint",
    peerReviewStatus: "preprint",
    notes: [
      "arXiv v3 PDF의 9-11쪽 Figure 4-5와 해당 본문을 페이지 렌더링으로 직접 검수했습니다.",
      "EK43 stock 98 mm burrs, 세 원두, light/dark roast, Mastersizer 2000 입도 분석과 반복 측정을 사용했습니다.",
      "추출 결과는 다크 로스트 에스프레소 조건에서 측정됐으며 V60 또는 종이 필터 추출을 직접 시험하지 않았습니다.",
      "논문 결론의 pour-over 막힘 언급은 저자의 외삽이므로 Observation으로 등록하지 않습니다.",
      "프리프린트이므로 동료평가 논문과 동일한 검수 신뢰도로 취급하지 않습니다.",
      "검수: project-maintainer, 2026-06-26.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
