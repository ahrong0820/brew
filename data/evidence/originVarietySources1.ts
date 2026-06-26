import type { EvidenceSource } from "@/lib/types/evidence";

const organization = {
  name: "World Coffee Research",
  role: "author",
  organization: "World Coffee Research",
} as const;

const shared = {
  type: "expert",
  authors: [organization],
  publisher: "World Coffee Research",
  accessedAt: "2026-06-26",
  language: "en",
  status: "active",
  medium: "article",
  expertProfile: {
    organization: "World Coffee Research",
  },
  createdAt: "2026-06-26T00:00:00Z",
  updatedAt: "2026-06-26T00:00:00Z",
} as const;

export const originVarietySources1 = [
  {
    ...shared,
    id: "expert:world-coffee-research:varieties-catalog:about",
    title: "About the Catalog",
    canonicalUrl: "https://varieties.worldcoffeeresearch.org/about-the-catalog",
    identifiers: [
      {
        scheme: "url",
        value: "https://varieties.worldcoffeeresearch.org/about-the-catalog",
      },
    ],
    notes: [
      "World Coffee Research가 운영하는 공식 Varieties Catalog의 목적, 범위와 사용상 제한을 설명하는 원문 페이지입니다.",
      "카탈로그는 환경, 고도, 토양, 수령과 농장 관리가 품질·수확량·건강에 영향을 준다고 명시합니다.",
      "현재 배치는 Source만 등록하며 Observation과 추천 규칙에는 연결하지 않습니다.",
    ],
  },
  {
    ...shared,
    id: "expert:world-coffee-research:varieties-catalog:bourbon",
    title: "Bourbon",
    canonicalUrl: "https://varieties.worldcoffeeresearch.org/varieties/bourbon",
    identifiers: [
      {
        scheme: "url",
        value: "https://varieties.worldcoffeeresearch.org/varieties/bourbon",
      },
    ],
    notes: [
      "World Coffee Research 공식 Varieties Catalog의 Bourbon 품종 페이지입니다.",
      "품종, 고도와 재배 지역 관련 사실은 별도 Observation PR에서 원문 위치를 직접 검증한 뒤 등록합니다.",
      "현재 배치는 Source만 등록하며 추천 계산과 CandidateRule에는 연결하지 않습니다.",
    ],
  },
  {
    ...shared,
    id: "expert:world-coffee-research:varieties-catalog:sl28",
    title: "SL28",
    canonicalUrl: "https://varieties.worldcoffeeresearch.org/varieties/sl28",
    identifiers: [
      {
        scheme: "url",
        value: "https://varieties.worldcoffeeresearch.org/varieties/sl28",
      },
    ],
    notes: [
      "World Coffee Research 공식 Varieties Catalog의 SL28 품종 페이지입니다.",
      "품종, 고도와 재배 지역 관련 사실은 별도 Observation PR에서 원문 위치를 직접 검증한 뒤 등록합니다.",
      "현재 배치는 Source만 등록하며 추천 계산과 CandidateRule에는 연결하지 않습니다.",
    ],
  },
  {
    ...shared,
    id: "expert:world-coffee-research:varieties-catalog:caturra",
    title: "Caturra",
    canonicalUrl: "https://varieties.worldcoffeeresearch.org/varieties/caturra",
    identifiers: [
      {
        scheme: "url",
        value: "https://varieties.worldcoffeeresearch.org/varieties/caturra",
      },
    ],
    notes: [
      "World Coffee Research 공식 Varieties Catalog의 Caturra 품종 페이지입니다.",
      "품종, 고도와 재배 지역 관련 사실은 별도 Observation PR에서 원문 위치를 직접 검증한 뒤 등록합니다.",
      "현재 배치는 Source만 등록하며 추천 계산과 CandidateRule에는 연결하지 않습니다.",
    ],
  },
] as const satisfies readonly EvidenceSource[];
