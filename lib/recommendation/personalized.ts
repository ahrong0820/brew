import { createRecommendation } from "@/lib/recommendation/engine";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, step: number) {
  const precision = step < 1 ? 10 : 1;
  return Math.round(Math.round(value / step) * step * precision) / precision;
}

function personalizedGrinder(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
) {
  const grindOffset = input.recommendationOffset?.grind ?? 0;

  if (!recommendation.grinder.isNumeric || grindOffset === 0) {
    return recommendation.grinder;
  }

  const current = Number(recommendation.grinder.displayValue);
  if (!Number.isFinite(current)) {
    return recommendation.grinder;
  }

  const step = input.grinder.displayStep ?? 1;
  const referencePoints = input.grinder.micronReference?.points ?? [];
  const fallbackBounds =
    input.grinder.model === "1zpresso-k-ultra"
      ? { min: 5.5, max: 8.5 }
      : input.grinder.model === "baratza-encore"
        ? { min: 8, max: 32 }
        : { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  const bounds =
    referencePoints.length > 0
      ? {
          min: Math.min(...referencePoints.map((point) => point.step)) +
            input.grinder.personalOffset,
          max: Math.max(...referencePoints.map((point) => point.step)) +
            input.grinder.personalOffset,
        }
      : fallbackBounds;
  const next = clamp(roundTo(current + grindOffset, step), bounds.min, bounds.max);
  const rangeWidth = input.grinder.model === "1zpresso-k-ultra" ? 0.2 : 2;
  const rangeMin = roundTo(next - rangeWidth, step);
  const rangeMax = roundTo(next + rangeWidth, step);
  const format = (value: number) =>
    input.grinder.displayUnit === "dial" ? value.toFixed(1) : String(Math.round(value));

  return {
    ...recommendation.grinder,
    displayValue: format(next),
    displayRange: `${format(rangeMin)}~${format(rangeMax)}`,
    note: `${recommendation.grinder.note} 이 원두의 이전 추출에서 저장한 분쇄도 보정 ${grindOffset > 0 ? "+" : ""}${format(grindOffset)}을 반영했습니다.`,
  };
}

export function createPersonalizedRecommendation(
  input: RecommendationInput,
): BrewRecommendation {
  const base = createRecommendation(input);
  const offset = input.recommendationOffset;

  if (!offset) {
    return base;
  }

  const temperatureOffset = offset.temperature ?? 0;
  const ratioOffset = offset.ratio ?? 0;
  const grindOffset = offset.grind ?? 0;
  const hasPersonalOffset =
    temperatureOffset !== 0 || ratioOffset !== 0 || grindOffset !== 0;

  if (!hasPersonalOffset) {
    return base;
  }

  const adjustedRatio = clamp(
    Math.round((base.ratio + ratioOffset) * 2) / 2,
    13,
    18,
  );
  const adjustedTemperature = clamp(
    base.temperatureCelsius + temperatureOffset,
    82,
    96,
  );

  return {
    ...base,
    ratio: adjustedRatio,
    temperatureCelsius: adjustedTemperature,
    grinder: personalizedGrinder(base, input),
    reasons: [
      ...base.reasons,
      "같은 원두·드리퍼·그라인더·맛 방향의 이전 추출 평가에서 저장한 개인 보정값을 반영했습니다.",
    ],
    confidenceReason:
      "초기 추천 규칙에 이 원두의 이전 추출 평가를 반영했습니다. 한 번에 한 변수만 조정한 결과를 추가로 기록하면 개인 추천의 신뢰도가 높아집니다.",
  };
}
