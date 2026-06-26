import type { EvidenceSource } from "@/lib/types/evidence";

export const roastSources1 = [
  {
    id: "paper:doi:10.3390/beverages6020029",
    type: "paper",
    title:
      "Roasting Conditions and Coffee Flavor: A Multi-Study Empirical Investigation",
    authors: [
      { name: "Morten Münchow", role: "author" },
      { name: "Jesper Alstrup", role: "author" },
      { name: "Ida Steen", role: "author" },
      { name: "Davide Giacalone", role: "author" },
    ],
    publisher: "MDPI",
    publishedAt: "2020-05-08",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://www.mdpi.com/2306-5710/6/2/29",
    identifiers: [
      {
        scheme: "doi",
        value: "10.3390/beverages6020029",
      },
    ],
    status: "active",
    journal: "Beverages",
    volume: "6",
    issue: "2",
    peerReviewStatus: "peer-reviewed",
    notes: [
      "MDPI 공식 논문 페이지에서 제목, 저자, 발행일, 저널 권호와 DOI를 직접 확인했습니다.",
      "현재 배치는 Source만 등록합니다.",
      "배전 색도, 시간과 감각 속성의 관계는 별도 Observation PR에서 본문과 표 위치를 직접 검증한 뒤 등록합니다.",
      "추천 계산과 CandidateRule에는 연결하지 않습니다.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
