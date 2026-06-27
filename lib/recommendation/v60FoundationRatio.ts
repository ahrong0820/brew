import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export const v60FoundationRatio = 16;
export const v60FoundationRatioRuleId =
  "ratio.v60-hot-paper.foundation-16.v1";

export function appliesV60FoundationRatio(input: RecommendationInput) {
  return (
    input.preferences.defaultBrewer === "v60" &&
    input.preferences.defaultDrinkStyle === "hot"
  );
}

export function initialRatioForRecommendation(input: RecommendationInput) {
  return appliesV60FoundationRatio(input) ? v60FoundationRatio : undefined;
}

export function applyV60FoundationRatio(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
): BrewRecommendation {
  if (!appliesV60FoundationRatio(input)) {
    return recommendation;
  }

  const reasons = recommendation.reasons.filter(
    (reason) => !reason.includes("목표에 맞춰 1:"),
  );

  reasons.push(
    "HOT V60 초기 비율은 직접 가이드의 1:15~1:17 범위 중앙인 1:16으로 시작하며, 맛 목표별 고정 비율 오프셋은 적용하지 않았습니다.",
  );
  reasons.push(
    "농도와 추출 수율은 비율뿐 아니라 분쇄도·유량·시간의 영향을 함께 받으므로 실제 맛과 목표 시간으로 다이얼인하세요.",
  );

  return {
    ...recommendation,
    ratio: v60FoundationRatio,
    reasons,
  };
}
