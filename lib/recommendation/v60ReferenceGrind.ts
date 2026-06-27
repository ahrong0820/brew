import {
  isKUltraOfficialProfile,
} from "@/lib/recommendation/kUltraOfficialRange";
import type { GrinderModel } from "@/lib/types/coffee";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export const v60ReferenceGrindRuleId =
  "grind.v60-hot-paper.reference-start-no-bean-offsets.v1";

const referenceStartByModel: Partial<Record<GrinderModel, number>> = {
  "1zpresso-k-ultra": 7,
  "baratza-encore": 18,
};

const referenceBoundsByModel: Partial<
  Record<GrinderModel, { min: number; max: number; width: number }>
> = {
  "1zpresso-k-ultra": { min: 5.5, max: 8.5, width: 0.2 },
  "baratza-encore": { min: 8, max: 32, width: 2 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, step: number) {
  const precision = step < 1 ? 10 : 1;
  return Math.round(Math.round(value / step) * step * precision) / precision;
}

function format(value: number, input: RecommendationInput) {
  return input.grinder.displayUnit === "dial"
    ? value.toFixed(1)
    : String(Math.round(value));
}

export function appliesV60ReferenceGrind(input: RecommendationInput) {
  return (
    input.preferences.defaultBrewer === "v60" &&
    input.preferences.defaultDrinkStyle === "hot" &&
    !isKUltraOfficialProfile(input.grinder) &&
    referenceStartByModel[input.grinder.model] !== undefined
  );
}

export function v60ReferenceGrindValue(
  model: GrinderModel,
  grinderPersonalOffset = 0,
) {
  const start = referenceStartByModel[model];
  const bounds = referenceBoundsByModel[model];
  if (start === undefined || !bounds) return null;
  const step = model === "1zpresso-k-ultra" ? 0.1 : 1;
  return clamp(roundTo(start + grinderPersonalOffset, step), bounds.min, bounds.max);
}

export function applyV60ReferenceGrind(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
): BrewRecommendation {
  if (!appliesV60ReferenceGrind(input)) return recommendation;

  const value = v60ReferenceGrindValue(
    input.grinder.model,
    input.grinder.personalOffset,
  );
  const bounds = referenceBoundsByModel[input.grinder.model];
  if (value === null || !bounds) return recommendation;

  const step = input.grinder.displayStep ?? 1;
  const rangeMin = clamp(roundTo(value - bounds.width, step), bounds.min, bounds.max);
  const rangeMax = clamp(roundTo(value + bounds.width, step), bounds.min, bounds.max);
  const reasons = recommendation.reasons.filter(
    (reason) =>
      reason !==
      "가공 방식은 분쇄도 시작점에만 보수적으로 반영하고, HOT V60 초기 온도에는 별도 오프셋을 더하지 않았습니다.",
  );
  reasons.push(
    "HOT V60의 비공식 교정 프로필은 기존 모델별 기준점에서 시작하되, 근거가 부족한 배전도·가공 방식·맛 목표·도징 분쇄도 오프셋은 적용하지 않았습니다.",
  );

  return {
    ...recommendation,
    grinder: {
      ...recommendation.grinder,
      displayValue: format(value, input),
      displayRange: `${format(rangeMin, input)}~${format(rangeMax, input)}`,
      isNumeric: true,
      note:
        input.grinder.model === "1zpresso-k-ultra"
          ? "버 비접촉 영점의 기존 HOT V60 참고 시작점입니다. 원두 속성별 임의 오프셋 대신 목표 시간과 맛에 따라 0.1~0.2씩 다이얼인하세요. 제조사 공식 8.0~9.0은 다른 영점 기준이므로 무보정으로 환산하지 않습니다."
          : "기본형 Baratza Encore의 기존 HOT V60 참고 시작점입니다. 원두 속성별 임의 오프셋 대신 목표 시간과 맛에 따라 1~2클릭씩 다이얼인하세요.",
    },
    reasons,
  };
}
