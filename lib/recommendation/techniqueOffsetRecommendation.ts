import type {
  AppliedRecommendationRule,
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

function techniqueRule(
  direction: "gentler" | "stronger",
): AppliedRecommendationRule {
  return {
    id: `pour.personal-${direction}.v1`,
    parameter: "pour",
    description:
      direction === "gentler"
        ? "개인 조정 이력에 따라 푸어 높이와 베드 교반을 한 단계 낮춤"
        : "개인 조정 이력에 따라 푸어 높이와 베드 교반을 한 단계 높임",
    evidence: [
      {
        kind: "personal",
        sourceId: "local:brew-adjustment-history",
        role: "calibrates",
        applicability: "direct",
      },
    ],
  };
}

export function applyTechniqueOffsetRecommendation(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
): BrewRecommendation {
  const offset = input.recommendationOffset?.["pour-structure"] ?? 0;
  if (offset === 0 || input.preferences.defaultBrewer === "clever") {
    return recommendation;
  }

  const direction = offset < 0 ? "gentler" : "stronger";
  const cue =
    direction === "gentler"
      ? "이번 추출은 주전자 높이를 낮추고 물줄기를 부드럽게 유지해 베드 교반을 줄이세요."
      : "이번 추출은 주전자 높이와 물줄기 에너지를 한 단계 높여 베드 교반을 늘리세요.";
  const steps = recommendation.steps.map((step, index) =>
    index === 0
      ? step
      : {
          ...step,
          cue: `${step.cue} ${cue}`,
        },
  );

  return {
    ...recommendation,
    steps,
    reasons: [
      ...recommendation.reasons,
      `[푸어 구조] 개인 조정 이력에 따라 ${
        direction === "gentler" ? "낮고 부드러운" : "조금 더 에너지 있는"
      } 푸어를 적용했습니다.`,
    ],
    appliedRules: [
      ...(recommendation.appliedRules ?? []),
      techniqueRule(direction),
    ],
  };
}
