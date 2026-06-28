import {
  applyRecipeGrindRecommendation as applyBaseRecipeGrindRecommendation,
  grinderCalibrationBasis,
  grinderCalibrationBasisLabel,
  grinderSafeRange,
} from "./grindRecommendationV2.ts";
import { formatGrindPresentation } from "./presentation.ts";
import type { BaristaRecipe } from "@/lib/types/baristaRecipe";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

function conversionSourceLabel(input: RecommendationInput) {
  if (input.personalRecipeGrindDisplayValue !== undefined) {
    return input.personalRecipeGrindStatus === "stable"
      ? "안정 개인 레시피"
      : "잠정 개인 레시피";
  }
  return "원본 레시피 분쇄 의도";
}

export function applyPresentedRecipeGrindRecommendation(
  recommendation: BrewRecommendation,
  recipe: BaristaRecipe,
  input: RecommendationInput,
): BrewRecommendation {
  const result = applyBaseRecipeGrindRecommendation(
    recommendation,
    recipe,
    input,
  );
  const original = recipe.grindIntent.originalDescription;
  const basisLabel = grinderCalibrationBasisLabel(
    grinderCalibrationBasis(input.grinder),
  );
  const safeRange = grinderSafeRange(input.grinder);
  const safeRangeLabel = safeRange
    ? `${safeRange.min}~${safeRange.max}`
    : "미확인";
  const sourceLabel = result.grinder.isNumeric
    ? conversionSourceLabel(input)
    : undefined;
  const note = formatGrindPresentation({
    original,
    start: result.grinder.isNumeric
      ? result.grinder.displayValue
      : undefined,
    unit: input.grinder.displayUnit,
    calibration: `${basisLabel} · ${input.grinder.calibrationLabel}`,
    source: sourceLabel,
    safeRange: safeRangeLabel,
  });

  return {
    ...result,
    grinder: {
      ...result.grinder,
      originalDescription: original,
      conversionSourceLabel: sourceLabel,
      calibrationBasisLabel: basisLabel,
      safeRangeLabel,
      personalRecipeStatus:
        input.personalRecipeGrindDisplayValue !== undefined
          ? input.personalRecipeGrindStatus
          : undefined,
      note,
    },
    reasons: [
      ...result.reasons,
      ...(input.personalRecipeGrindDisplayValue !== undefined
        ? [
            `[개인 성공] ${sourceLabel}의 성공 분쇄도를 다음 시작값으로 우선 적용했습니다.`,
          ]
        : []),
    ],
  };
}
