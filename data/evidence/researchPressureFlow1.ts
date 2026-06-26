import type { EvidenceSource } from "@/lib/types/evidence";

export const researchPressureFlow1Sources = [
  {
    id: "paper:arxiv:2512.21528:v2",
    type: "paper",
    title: "Under pressure: poroelastic regulation of flow in espresso brewing",
    authors: [
      { name: "Radost Waszkiewicz", role: "author" },
      { name: "Franciszek Myck", role: "author" },
      { name: "Łukasz Białas", role: "author" },
      { name: "Maria Puciata-Mroczynska", role: "author" },
      { name: "Michał Dzikowski", role: "author" },
      { name: "Piotr Szymczak", role: "author" },
      { name: "Maciej Lisicki", role: "author" },
    ],
    publisher: "arXiv",
    publishedAt: "2026-05-09",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://arxiv.org/abs/2512.21528",
    identifiers: [
      { scheme: "url", value: "https://arxiv.org/abs/2512.21528v2" },
      { scheme: "doi", value: "10.48550/arXiv.2512.21528" },
    ],
    status: "active",
    journal: "Preprint accepted in Physics of Fluids",
    peerReviewStatus: "preprint",
    notes: [
      "arXiv v2는 2026-05-09 개정본이며 원문은 Physics of Fluids 게재 수락 상태라고 명시합니다.",
      "자료 위치: PDF 8쪽 Figure 5-6의 압력별 유량 실험과 PDF 9쪽 Figure 7의 시간 분할 TDS·용질 유량 결과를 페이지 렌더링으로 직접 검수했습니다.",
      "18.50 g의 단일 브라질 Igarape 커피, Fiorenzato F64 EVO 고정 설정, Sanremo Zoe 머신과 IMS 바스켓을 사용한 통제 에스프레소 실험입니다.",
      "장시간 유동 특성을 측정하기 위해 일반적인 에스프레소보다 긴 약 120초까지 추출했으며 장기 유량은 마지막 10초 평균으로 계산했습니다.",
      "적용 범위: 고압 에스프레소 커피층의 압력·압축·용해와 유량 관계이며 V60·종이 필터·중력식 추출로 직접 일반화하지 않습니다.",
      "프리프린트이므로 최종 출판본 확인 전에는 동료평가 확정본과 같은 검수 신뢰도로 취급하지 않습니다.",
      "검수: project-maintainer, 2026-06-26.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
