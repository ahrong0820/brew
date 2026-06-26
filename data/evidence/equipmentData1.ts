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
  {
    id: "manufacturer:1zpresso:k-ultra:grind-setting-reference-2023",
    type: "manufacturer",
    title: "K-Ultra Grind Setting Reference",
    authors: [
      {
        name: "1Zpresso",
        role: "manufacturer",
        organization: "1Zpresso",
      },
    ],
    publisher: "1Zpresso",
    accessedAt: "2026-06-27",
    language: "en",
    canonicalUrl:
      "https://1zpresso.coffee/wp-content/uploads/2023/03/K-Ultra-Grind-Setting-Reference-20230327.jpg",
    identifiers: [
      {
        scheme: "url",
        value:
          "https://1zpresso.coffee/wp-content/uploads/2023/03/K-Ultra-Grind-Setting-Reference-20230327.jpg",
      },
      {
        scheme: "manufacturer-document",
        value: "1zpresso-k-ultra-grind-setting-reference-20230327",
      },
    ],
    status: "active",
    productModel: "K-Ultra",
    documentVersion: "asset-filename-20230327",
    notes: [
      "1Zpresso 공식 Manual 페이지의 Grind Settings Reference에서 K-Ultra 항목으로 직접 연결되는 제조사 차트입니다.",
      "차트 자산 파일명에 20230327이 포함되지만 이를 별도의 공식 발행일 표기로 단정하지 않습니다.",
      "차트의 숫자는 제조사 공식 영점 정의를 전제로 하며 사용자 비접촉 영점에 무보정으로 전환하지 않습니다.",
    ],
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
