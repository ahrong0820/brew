export interface EvidenceLineageRecord {
  id: string;
  familyId: string;
  sourceIds: readonly string[];
  observationIds: readonly string[];
  relationship: string;
  independencePolicy: "single-author-family" | "independent";
  notes: readonly string[];
}

export const advisorLineageScottRao = [
  {
    id: "lineage:scott-rao:filter-grind-dial-in",
    familyId: "expert:scott-rao:filter-grind-dial-in",
    sourceIds: [
      "expert:scott-rao:brewing-different-coffees-2024",
      "expert:scott-rao:choose-grind-setting-2026",
    ],
    observationIds: [
      "obs:expert-data-2:foundational-recipe-grind-first",
      "obs:expert-data-2:target-time-over-nominal-setting",
      "obs:expert-data-2:grind-setting-context-dependence",
      "obs:expert-data-2:coarse-first-recovery",
    ],
    relationship:
      "The 2026 article extends and restates the 2024 article's target-time and coarse-first dial-in guidance.",
    independencePolicy: "single-author-family",
    notes: [
      "두 글을 서로 독립적인 전문가 지지 두 건으로 합산하지 않습니다.",
      "서로 다른 주장 단위는 분리하되 독립성 계수는 동일 저자·동일 계보를 반영해 낮춥니다.",
      "추후 논문 또는 다른 저자의 직접 자료가 같은 주장을 지지할 때만 독립 근거를 추가합니다.",
    ],
  },
] as const satisfies readonly EvidenceLineageRecord[];
