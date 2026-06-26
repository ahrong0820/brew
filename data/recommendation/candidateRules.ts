import type { CandidateRule } from "@/lib/types/candidateRule";

export const candidateRules = [
  {
    id: "candidate:grind:v60-hot:dial-in-v1",
    revision: 1,
    parameter: "grind",
    hypothesis:
      "종이 필터 HOT V60에서는 기본 도징·비율·온도를 유지한 채 충분히 굵은 초기값에서 시작해 목표 시간과 감각 결과가 허용하는 범위까지 점진적으로 미세화하고, 막힘·채널링·떫은맛이 증가하면 굵게 되돌린다.",
    scope: {
      brew: {
        brewerTypes: ["v60"],
        drinkStyles: ["hot"],
        filterMaterials: ["paper"],
      },
    },
    audience: "global",
    supportingObservationIds: [
      "obs:expert-data-1:v60-grind-sensitivity",
      "obs:expert-data-2:foundational-recipe-grind-first",
      "obs:expert-data-2:target-time-over-nominal-setting",
    ],
    limitingObservationIds: [
      "obs:expert-data-2:grind-setting-context-dependence",
      "obs:expert-data-2:coarse-first-recovery",
    ],
    contradictingObservationIds: [],
    status: "reviewed",
    confidenceScore: 0.46,
    reviewedBy: "project-maintainer",
    reviewedAt: "2026-06-26",
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const satisfies readonly CandidateRule[];
