import type { EvidenceSource } from "@/lib/types/evidence";

const registryTimestamp = "2026-06-26T00:00:00Z";

export const evidenceSources = [
  {
    id: "internal:initial-rule-set:v1",
    type: "internal",
    title: "초기 추천 규칙 집합 v1",
    authors: [{ name: "Brew recommendation engine", role: "system" }],
    accessedAt: "2026-06-26",
    language: "ko",
    identifiers: [{ scheme: "internal", value: "initial-rule-set-v1" }],
    status: "active",
    rationale:
      "외부 근거 레지스트리 도입 전에 운영되던 배전도·가공 방식·맛 목표·드리퍼 기반 휴리스틱을 추적하기 위한 내부 출처입니다.",
    notes: [
      "외부 자료에 의해 검증된 규칙이라는 의미가 아닙니다.",
      "향후 실제 관찰 근거가 연결되면 규칙별로 대체하거나 제한합니다.",
    ],
    createdAt: registryTimestamp,
    updatedAt: registryTimestamp,
  },
  {
    id: "local:user-brew-history",
    type: "personal",
    title: "사용자 로컬 추출 기록",
    authors: [{ name: "Local brew session store", role: "system" }],
    accessedAt: "2026-06-26",
    language: "ko",
    identifiers: [{ scheme: "internal", value: "brewSessions" }],
    status: "active",
    runtimeCollection: "brewSessions",
    notes: [
      "정적 관찰값을 저장하지 않고 BrewSession에서 런타임에 파생합니다.",
      "사용자 개인화 근거이며 전체 사용자용 보편 규칙의 단독 근거로 사용하지 않습니다.",
    ],
    createdAt: registryTimestamp,
    updatedAt: registryTimestamp,
  },
  {
    id: "manufacturer:holzklotz-e80-micron-reference",
    type: "manufacturer",
    title: "홀츠클로츠 E80 제조사 Step-미크론 기준",
    authors: [
      {
        name: "Holzklotz",
        role: "manufacturer",
        organization: "Holzklotz",
      },
    ],
    publisher: "Holzklotz",
    accessedAt: "2026-06-26",
    language: "ko",
    identifiers: [
      {
        scheme: "manufacturer-document",
        value: "holzklotz-e80-step-micron-reference",
      },
    ],
    status: "active",
    productModel: "Holzklotz E80",
    notes: [
      "현재 애플리케이션의 기본 그라인더 프로필에 포함된 제조사 제공 표를 출처로 등록합니다.",
      "원본 문서 URL과 문서 버전은 후속 자료 검수 단계에서 보강합니다.",
    ],
    createdAt: registryTimestamp,
    updatedAt: registryTimestamp,
  },
] as const satisfies readonly EvidenceSource[];
