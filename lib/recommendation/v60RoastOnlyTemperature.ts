import type { RoastLevel } from "@/lib/types/coffee";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export const v60RoastOnlyTemperatureRuleId =
  "temperature.v60-hot-paper.roast-only.v1";

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 94,
  "medium-light": 92,
  medium: 90,
  "medium-dark": 88,
  dark: 85,
  unknown: 91,
};

export function v60RoastOnlyTemperature(roastLevel: RoastLevel) {
  return temperatureByRoast[roastLevel];
}

export function appliesV60RoastOnlyTemperature(input: RecommendationInput) {
  return (
    input.preferences.defaultBrewer === "v60" &&
    input.preferences.defaultDrinkStyle === "hot"
  );
}

export function applyV60RoastOnlyTemperature(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
): BrewRecommendation {
  if (!appliesV60RoastOnlyTemperature(input)) {
    return recommendation;
  }

  const reasons = recommendation.reasons.filter(
    (reason) =>
      reason !==
      "가공 향의 과도한 추출을 줄이도록 온도와 분쇄도를 보수적으로 조정했습니다.",
  );

  if (input.bean.process === "natural" || input.bean.process === "fermented") {
    reasons.push(
      "가공 방식은 분쇄도 시작점에만 보수적으로 반영하고, HOT V60 초기 온도에는 별도 오프셋을 더하지 않았습니다.",
    );
  }

  reasons.push(
    "HOT V60 초기 온도는 기존 배전도 기준값을 유지하고, 근거가 부족한 맛 목표·가공 방식 온도 오프셋은 적용하지 않았습니다.",
  );

  return {
    ...recommendation,
    temperatureCelsius: v60RoastOnlyTemperature(input.bean.roastLevel),
    reasons,
  };
}
