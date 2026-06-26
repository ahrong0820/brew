import type { EvidenceSource } from "@/lib/types/evidence";

export const equipmentData1Sources = [
  {
    id: "manufacturer:1zpresso:k-ultra:manual-2022",
    type: "manufacturer",
    title: "User Manual - K-Ultra",
    authors: [
      {
        name: "1Zpresso",
        role: "manufacturer",
        organization: "1Zpresso",
      },
    ],
    publisher: "1Zpresso",
    publishedAt: "2022-11-03",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://1zpresso.coffee/manual-kultra-en/",
    identifiers: [
      {
        scheme: "manufacturer-document",
        value: "1zpresso-k-ultra-user-manual-2022",
      },
    ],
    status: "active",
    productModel: "K-Ultra",
    documentVersion: "2022-11-03",
    notes: [
      "공식 매뉴얼의 조절 방향, 클릭당 버 이동량과 영점 정의를 교정 자료로 사용합니다.",
      "클릭당 20µm는 버 이동량이며 분쇄 입자의 평균 또는 대표 입도와 동일하지 않습니다.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
