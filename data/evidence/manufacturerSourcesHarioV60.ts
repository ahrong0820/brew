import type { EvidenceSource } from "@/lib/types/evidence";

export const manufacturerSourcesHarioV60 = [
  {
    id: "manufacturer:hario:v60-dripper-manual-global",
    type: "manufacturer",
    title: "V60 Dripper",
    authors: [
      {
        name: "HARIO Co., Ltd.",
        role: "manufacturer",
        organization: "HARIO Co., Ltd.",
      },
    ],
    publisher: "HARIO Co., Ltd.",
    accessedAt: "2026-06-27",
    language: "multi",
    canonicalUrl: "https://global.hario.com/product/VD_global.pdf",
    identifiers: [
      {
        scheme: "manufacturer-document",
        value: "84291800 / V60 common leaflet EX 2104",
      },
      {
        scheme: "url",
        value: "https://global.hario.com/product/VD_global.pdf",
      },
    ],
    status: "active",
    productModel: "V60 Dripper VD/VDC series",
    documentVersion: "84291800 / V60 common leaflet EX 2104",
    notes: [
      "HARIO 글로벌 공식 제품 페이지에서 연결되는 V60 드리퍼 다국어 사용 설명서입니다.",
      "영문 추출 지침은 PDF 4쪽, 한국어 추출 지침은 PDF 7쪽에 있습니다.",
      "Source 단계에서는 설명서의 존재와 문서 식별 정보만 등록하며 수치와 절차는 별도 Observation으로 분리합니다.",
      "웹 PDF 스크린샷 호출은 원본 서버 캐시 오류로 실패했으며, 동일 PDF의 파싱된 페이지 텍스트와 공식 제품 페이지 연결을 교차 확인했습니다.",
    ],
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
