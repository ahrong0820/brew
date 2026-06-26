import {
  createV60FoundationSteps,
  v60FoundationTargetTime,
} from "@/lib/recommendation/v60Foundation";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export function appliesV60HotPaperFoundation(input: RecommendationInput) {
  return (
    input.preferences.defaultBrewer === "v60" &&
    input.preferences.defaultDrinkStyle === "hot"
  );
}

export function applyV60FoundationRecommendation(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
): BrewRecommendation {
  if (!appliesV60HotPaperFoundation(input)) {
    return recommendation;
  }

  return {
    ...recommendation,
    templateName: `V60 ${
      input.tasteGoal === "balanced"
        ? "밸런스"
        : input.tasteGoal === "sweet"
          ? "단맛"
          : input.tasteGoal === "bright"
            ? "향미"
            : "바디"
    }형 30초 블루밍`,
    targetTimeMinSeconds: v60FoundationTargetTime.min,
    targetTimeMaxSeconds: v60FoundationTargetTime.max,
    steps: createV60FoundationSteps(
      recommendation.doseGrams,
      recommendation.waterGrams,
    ),
    reasons: [
      ...recommendation.reasons,
      "HOT V60 종이필터의 공식·전문가 공통 범위에 따라 30초 블루밍, 원형 본 주입과 2분 30초~3분 목표 시간을 적용했습니다.",
    ],
  };
}
