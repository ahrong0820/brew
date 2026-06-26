import type { EvidenceSource } from "@/lib/types/evidence";

export const researchUnevenExtraction1Sources = [
  {
    id: "paper:physics-of-fluids:2023:5.0138998",
    type: "paper",
    title: "Uneven Extraction in Coffee Brewing",
    authors: [
      { name: "W. T. Lee", role: "author" },
      { name: "A. Smith", role: "author" },
      { name: "A. Arshad", role: "author" },
    ],
    publisher: "AIP Publishing",
    publishedAt: "2023-04-10",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://doi.org/10.1063/5.0138998",
    identifiers: [
      { scheme: "doi", value: "10.1063/5.0138998" },
      { scheme: "url", value: "https://arxiv.org/abs/2206.12373v2" },
    ],
    status: "active",
    journal: "Physics of Fluids",
    peerReviewStatus: "peer-reviewed",
    notes: [
      "Physics of Fluids 게재 논문의 저자 공개 arXiv v2 수락본을 검수했습니다.",
      "자료 위치: arXiv v2 PDF 1쪽의 연구 범위, 4쪽 Figure 5-7, 5쪽 Discussion과 Conclusions입니다.",
      "Cameron 등의 에스프레소 실험 데이터에 단순한 두 유로 수학 모델을 적합한 연구이며 새로운 통제 추출 실험은 아닙니다.",
      "적용 범위: 고압 에스프레소 커피층의 분쇄도·유동·추출 불균일성 모델이며 V60·종이 필터·중력식 유속을 직접 측정하지 않았습니다.",
      "모델은 정성적 추세를 재현하지만 관측된 미세 분쇄 구간의 추출 감소를 만들기 위해 측정값의 두 배인 비물리적 커피 밀도 매개변수를 사용했습니다.",
      "검수: project-maintainer, 2026-06-26.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
