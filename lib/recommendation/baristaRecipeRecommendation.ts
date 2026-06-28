import { selectBaristaRecipe } from "#barista-recipe-matcher";
import { applyPresentedRecipeGrindRecommendation } from "./grinderPresentationRecommendation.ts";
import type { BaristaRecipe } from "@/lib/types/baristaRecipe";
import type {
  AppliedRecommendationRule,
  BrewRecommendation,
  RecommendationInput,
  RecommendationStep,
} from "@/lib/types/recommendation";

const replacedParameters = new Set([
  "water",
  "ratio",
  "temperature",
  "pour",
  "time",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundRatio(value: number) {
  return Math.round(value * 10) / 10;
}

function roundWater(value: number) {
  return Math.round(value / 5) * 5;
}

function scaleRecipeSteps(
  recipe: BaristaRecipe,
  waterGrams: number,
): RecommendationStep[] {
  const scale = waterGrams / recipe.waterGrams;

  return recipe.steps.map((step, index) => ({
    label: step.label,
    startSeconds: step.startSeconds,
    targetWaterGrams:
      index === recipe.steps.length - 1
        ? waterGrams
        : Math.min(waterGrams, roundWater(step.targetWaterGrams * scale)),
    cue: step.cue,
  }));
}

function recipeRule(
  id: string,
  parameter: AppliedRecommendationRule["parameter"],
  description: string,
  recipe: BaristaRecipe,
): AppliedRecommendationRule {
  return {
    id,
    parameter,
    description,
    evidence: [
      {
        kind: "heuristic",
        sourceId: `barista-recipe:${recipe.id}`,
        role: "context",
        applicability: "partial",
        note: `${recipe.sourceLabel}. 원본 출처 직접 검증 전까지 참고 레시피로 적용합니다.`,
      },
    ],
  };
}

function recipeAppliedRules(
  recommendation: BrewRecommendation,
  recipe: BaristaRecipe,
): AppliedRecommendationRule[] {
  const preserved = (recommendation.appliedRules ?? []).filter(
    (rule) => !replacedParameters.has(rule.parameter),
  );

  return [
    ...preserved,
    recipeRule(
      "recipe.barista-catalog-match.v2",
      "pour",
      "원두 특성과 원하는 맛에 맞는 추출 레시피를 선택",
      recipe,
    ),
    recipeRule(
      "ratio.barista-recipe-original.v1",
      "ratio",
      "선택한 바리스타 레시피의 원본 비율을 시작점으로 적용",
      recipe,
    ),
    recipeRule(
      "water.barista-recipe-dose-scaling.v1",
      "water",
      "사용자 원두량에 맞춰 원본 레시피 물량과 단계별 누적 물량을 비례 조정",
      recipe,
    ),
    recipeRule(
      "temperature.barista-recipe-original.v1",
      "temperature",
      "선택한 바리스타 레시피의 원본 물 온도를 시작점으로 적용",
      recipe,
    ),
    recipeRule(
      "time.barista-recipe-target.v1",
      "time",
      "선택한 바리스타 레시피의 목표 시간 범위를 적용",
      recipe,
    ),
  ];
}

export function applyBaristaRecipeRecommendation(
  recommendation: BrewRecommendation,
  input: RecommendationInput,
): BrewRecommendation {
  const match = selectBaristaRecipe(
    {
      brewerType: input.preferences.defaultBrewer,
      drinkStyle: input.preferences.defaultDrinkStyle,
      roastLevel: input.bean.roastLevel,
      process: input.bean.process,
      tasteGoal: input.tasteGoal,
      doseGrams: recommendation.doseGrams,
      flavorNotes: input.bean.flavorNotes,
      originCountry: input.bean.originCountry,
      originGroup: input.bean.originGroup,
      originRegions: input.bean.originRegions,
      variety: input.bean.variety,
    },
    input.baristaRecipeId,
  );

  if (!match) return recommendation;

  const recipe = match.recipe;
  const ratio = clamp(
    roundRatio(recipe.ratio + (input.recommendationOffset?.ratio ?? 0)),
    13,
    18,
  );
  const waterGrams = roundWater(recommendation.doseGrams * ratio);
  const temperatureCelsius =
    recipe.temperatureCelsius === undefined
      ? recommendation.temperatureCelsius
      : clamp(
          recipe.temperatureCelsius +
            (input.recommendationOffset?.temperature ?? 0),
          82,
          96,
        );

  const recipeRecommendation: BrewRecommendation = {
    ...recommendation,
    templateName: recipe.name,
    sourceRecipeId: recipe.id,
    waterGrams,
    ratio,
    temperatureCelsius,
    targetTimeMinSeconds: recipe.targetTimeMinSeconds,
    targetTimeMaxSeconds: recipe.targetTimeMaxSeconds,
    steps: scaleRecipeSteps(recipe, waterGrams),
    reasons: [
      `${recipe.author}의 ${recipe.name}을 원본 템플릿으로 선택했습니다.`,
      ...match.reasons,
      `원본 ${recipe.doseGrams}g/${recipe.waterGrams}g 구성을 ${recommendation.doseGrams}g/${waterGrams}g으로 비례 조정했습니다.`,
    ],
    confidence: "reference",
    confidenceReason:
      "선택된 레시피는 현재 참고 카탈로그 단계입니다. 추출 후 속도와 맛 평가를 기록하면 같은 원두·장비 조건의 개인 맞춤값이 우선 적용됩니다.",
    appliedRules: recipeAppliedRules(recommendation, recipe),
  };

  return applyPresentedRecipeGrindRecommendation(
    recipeRecommendation,
    recipe,
    input,
  );
}
