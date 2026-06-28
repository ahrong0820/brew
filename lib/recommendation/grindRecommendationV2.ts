import type {
  BaristaRecipe,
  BaristaRecipeGrindIntent,
} from "@/lib/types/baristaRecipe";
import type { GrinderProfile } from "@/lib/types/coffee";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export type GrinderCalibrationBasis =
  | "official"
  | "user"
  | "reference"
  | "unknown";

export interface GrinderSafeRange {
  min: number;
  max: number;
  width: number;
}

export interface RecipeGrindStart {
  value: number;
  range: GrinderSafeRange;
  source: "personal" | "recipe-microns" | "recipe-intent";
  representativeMicrons?: number;
}

const flowCoarseness: Record<BaristaRecipeGrindIntent["targetFlow"], number> = {
  fast: 0.75,
  moderate: 0.55,
  slow: 0.35,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number) {
  const decimals = (String(step).split(".")[1] ?? "").length;
  const precision = decimals > 0 ? 10 ** decimals : 1;
  return Math.round(Math.round(value / step) * step * precision) / precision;
}

function formatSetting(value: number, grinder: GrinderProfile) {
  if (grinder.displayUnit === "dial") {
    const decimals = Math.max(
      1,
      (String(grinder.displayStep ?? 0.1).split(".")[1] ?? "").length,
    );
    return value.toFixed(decimals);
  }
  return String(Math.round(value));
}

export function grinderCalibrationBasis(
  grinder: Pick<
    GrinderProfile,
    | "calibrationProfile"
    | "calibrationStatus"
    | "micronReference"
    | "recommendationStatus"
  >,
): GrinderCalibrationBasis {
  if (
    grinder.calibrationProfile === "manufacturer-resistance-start-zero" ||
    (grinder.calibrationStatus === "factory" &&
      grinder.micronReference?.source === "manufacturer")
  ) {
    return "official";
  }
  if (grinder.calibrationStatus === "user-calibrated") return "user";
  if (
    grinder.micronReference?.source === "community" ||
    grinder.micronReference?.source === "reference" ||
    grinder.recommendationStatus === "reference"
  ) {
    return "reference";
  }
  return "unknown";
}

export function grinderCalibrationBasisLabel(
  basis: GrinderCalibrationBasis,
) {
  if (basis === "official") return "공식 기준";
  if (basis === "user") return "사용자 영점";
  if (basis === "reference") return "참고 기준";
  return "영점 미확인";
}

export function grinderSafeRange(
  grinder: Pick<
    GrinderProfile,
    | "model"
    | "calibrationProfile"
    | "displayStep"
    | "micronReference"
  >,
): GrinderSafeRange | null {
  if (
    grinder.model === "1zpresso-k-ultra" &&
    grinder.calibrationProfile === "manufacturer-resistance-start-zero"
  ) {
    return { min: 8, max: 9, width: 0.2 };
  }
  if (grinder.model === "1zpresso-k-ultra") {
    return { min: 5.5, max: 8.5, width: 0.2 };
  }
  if (grinder.model === "baratza-encore") {
    return { min: 8, max: 32, width: 2 };
  }

  const points = grinder.micronReference?.points ?? [];
  if (points.length > 0) {
    const steps = points.map((point) => point.step);
    return {
      min: Math.min(...steps),
      max: Math.max(...steps),
      width: Math.max(grinder.displayStep ?? 1, (grinder.displayStep ?? 1) * 2),
    };
  }
  return null;
}

function settingForMicrons(grinder: GrinderProfile, targetMicrons: number) {
  const points = [...(grinder.micronReference?.points ?? [])].sort(
    (left, right) => left.microns - right.microns,
  );
  if (points.length === 0) return null;
  if (targetMicrons <= points[0].microns) return points[0].step;
  if (targetMicrons >= points[points.length - 1].microns) {
    return points[points.length - 1].step;
  }

  for (let index = 1; index < points.length; index += 1) {
    const lower = points[index - 1];
    const upper = points[index];
    if (targetMicrons > upper.microns) continue;
    const ratio =
      (targetMicrons - lower.microns) / (upper.microns - lower.microns);
    return lower.step + (upper.step - lower.step) * ratio;
  }
  return null;
}

function settingForFlow(
  grinder: GrinderProfile,
  intent: BaristaRecipeGrindIntent,
  range: GrinderSafeRange,
) {
  const coarseness = flowCoarseness[intent.targetFlow];
  return grinder.adjustmentDirection === "higher-is-finer"
    ? range.max - (range.max - range.min) * coarseness
    : range.min + (range.max - range.min) * coarseness;
}

export function recipeGrindStart(
  recipe: Pick<BaristaRecipe, "grindIntent">,
  grinder: GrinderProfile,
  personalGrindDisplayValue?: string,
): RecipeGrindStart | null {
  const range = grinderSafeRange(grinder);
  if (!range) return null;
  const step = grinder.displayStep ?? 1;
  const personalValue = Number(personalGrindDisplayValue);

  if (
    personalGrindDisplayValue !== undefined &&
    Number.isFinite(personalValue)
  ) {
    return {
      value: clamp(roundToStep(personalValue, step), range.min, range.max),
      range,
      source: "personal",
    };
  }

  const representative = recipe.grindIntent.representativeMicrons;
  const representativeMicrons = representative
    ? (representative.min + representative.max) / 2
    : undefined;
  const micronSetting =
    representativeMicrons === undefined
      ? null
      : settingForMicrons(grinder, representativeMicrons);
  const rawValue =
    micronSetting ?? settingForFlow(grinder, recipe.grindIntent, range);
  const value = clamp(
    roundToStep(rawValue + grinder.personalOffset, step),
    range.min,
    range.max,
  );

  return {
    value,
    range,
    source: micronSetting === null ? "recipe-intent" : "recipe-microns",
    representativeMicrons,
  };
}

function sourceLabel(
  source: RecipeGrindStart["source"],
  personalStatus?: RecommendationInput["personalRecipeGrindStatus"],
) {
  if (source === "personal") {
    return personalStatus === "stable"
      ? "안정 개인 레시피"
      : "잠정 개인 레시피";
  }
  if (source === "recipe-microns") return "원본 대표 입도";
  return "원본 분쇄 의도";
}

export function applyRecipeGrindRecommendation(
  recommendation: BrewRecommendation,
  recipe: BaristaRecipe,
  input: RecommendationInput,
): BrewRecommendation {
  const start = recipeGrindStart(
    recipe,
    input.grinder,
    input.personalRecipeGrindDisplayValue,
  );
  const original = recipe.grindIntent.originalDescription;
  const basis = grinderCalibrationBasis(input.grinder);
  const basisLabel = grinderCalibrationBasisLabel(basis);

  if (!start) {
    return {
      ...recommendation,
      grinder: {
        ...recommendation.grinder,
        commonDescription: original,
        note: `${recommendation.grinder.note} 원본 분쇄 표현은 “${original}”입니다. ${basisLabel}에서 안전한 숫자 변환 범위를 확인할 수 없어 숫자를 강제하지 않습니다.`,
      },
      reasons: [
        ...recommendation.reasons,
        `[분쇄 변환] 원본 “${original}”을 보존하고, 현재 그라인더의 영점·범위가 불명확해 숫자 변환은 생략했습니다.`,
      ],
    };
  }

  const value = start.value;
  const rangeMin = clamp(
    roundToStep(value - start.range.width, input.grinder.displayStep ?? 1),
    start.range.min,
    start.range.max,
  );
  const rangeMax = clamp(
    roundToStep(value + start.range.width, input.grinder.displayStep ?? 1),
    start.range.min,
    start.range.max,
  );
  const formattedValue = formatSetting(value, input.grinder);
  const formattedRange = `${formatSetting(rangeMin, input.grinder)}~${formatSetting(rangeMax, input.grinder)}`;
  const convertedFrom = sourceLabel(start.source, input.personalRecipeGrindStatus);
  const micronNote =
    start.source === "recipe-microns" && start.representativeMicrons !== undefined
      ? ` 대표 입도 약 ${Math.round(start.representativeMicrons)}μm를 사용했습니다.`
      : "";

  return {
    ...recommendation,
    grinder: {
      ...recommendation.grinder,
      displayValue: formattedValue,
      displayRange: formattedRange,
      commonDescription: original,
      calibrationLabel: input.grinder.calibrationLabel,
      isNumeric: true,
      note: `원본 분쇄 표현은 “${original}”입니다. ${convertedFrom}를 ${basisLabel}인 “${input.grinder.calibrationLabel}”에 맞춰 ${formattedValue} ${input.grinder.displayUnit} 시작값으로 변환했습니다.${micronNote} 안전 추천 범위 ${start.range.min}~${start.range.max} 밖으로는 제안하지 않습니다.`,
    },
    reasons: [
      ...recommendation.reasons,
      `[분쇄 변환] 원본 “${original}” → ${input.grinder.displayName} ${formattedValue} (${formattedRange}, ${basisLabel})`,
    ],
  };
}
