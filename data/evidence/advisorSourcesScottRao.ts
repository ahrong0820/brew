import type { EvidenceSource } from "@/lib/types/evidence";

export const advisorSourcesScottRao = [
  {
    id: "expert:scott-rao:brewing-different-coffees-2024",
    type: "expert",
    title: "How to approach brewing different coffees",
    authors: [
      {
        name: "Scott Rao",
        role: "author",
        organization: "Scott Rao",
      },
    ],
    publisher: "Scott Rao",
    publishedAt: "2024-02-26",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl:
      "https://www.scottrao.com/blog/2024/2/26/how-to-approach-brewing-different-coffees",
    identifiers: [
      {
        scheme: "url",
        value:
          "https://www.scottrao.com/blog/2024/2/26/how-to-approach-brewing-different-coffees",
      },
    ],
    status: "active",
    medium: "article",
    expertProfile: {
      organization: "Scott Rao",
    },
    notes: [
      "Scott Rao가 본인 웹사이트에 직접 작성한 브루잉 다이얼인 가이드입니다.",
      "근거 분류: expert-opinion이며 통제 실험 논문과 같은 방법론적 무게로 취급하지 않습니다.",
      "적용 범위: 비슷한 배전도의 비결점 커피를 전제로 한 에스프레소와 필터 브루잉의 일반 원칙입니다.",
      "예외로 미분이 매우 많은 에티오피아 커피와 디카페인은 막힘을 피하기 위해 도징 조정이 필요할 수 있다고 명시합니다.",
      "계보: expert:scott-rao:filter-grind-dial-in 계열의 기초 자료이며 2026년 글이 일부 주장을 확장·재진술합니다.",
      "검수: project-maintainer, 2026-06-26.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
  {
    id: "expert:scott-rao:choose-grind-setting-2026",
    type: "expert",
    title: "How to choose a grind setting",
    authors: [
      {
        name: "Scott Rao",
        role: "author",
        organization: "Scott Rao",
      },
    ],
    publisher: "Scott Rao",
    publishedAt: "2026-05-04",
    accessedAt: "2026-06-26",
    language: "en",
    canonicalUrl: "https://www.scottrao.com/blog/how-to-choose-a-grind-setting",
    identifiers: [
      {
        scheme: "url",
        value: "https://www.scottrao.com/blog/how-to-choose-a-grind-setting",
      },
    ],
    status: "active",
    medium: "article",
    expertProfile: {
      organization: "Scott Rao",
    },
    notes: [
      "Scott Rao가 본인 웹사이트에 직접 작성한 분쇄도 선택 가이드입니다.",
      "근거 분류: expert-opinion이며 통제 실험 논문과 같은 방법론적 무게로 취급하지 않습니다.",
      "적용 범위: V60 사례를 중심으로 한 필터 브루잉 다이얼인이며 특정 그라인더 숫자를 보편값으로 제시하지 않습니다.",
      "계보: expert:scott-rao:filter-grind-dial-in 계열에서 2024년 글의 목표 시간·굵게 시작하기 원칙을 확장·재진술합니다.",
      "검수: project-maintainer, 2026-06-26.",
    ],
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly EvidenceSource[];
