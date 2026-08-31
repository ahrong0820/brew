import type { Recipe, WaterAmount } from "../types/defaultRecipe.ts";

function scaleNumber(value: number, factor: number) {
  return Math.round(value * factor);
}

function scaleWaterAmount(amount: WaterAmount, factor: number): WaterAmount {
  if (typeof amount === "number") {
    return scaleNumber(amount, factor);
  }

  return {
    min: scaleNumber(amount.min, factor),
    max: scaleNumber(amount.max, factor),
  };
}

export function scaleRecipeDose(recipe: Recipe, nextDose: number): Recipe {
  if (recipe.dosePolicy?.type === "fixed") {
    return recipe;
  }

  if (!Number.isFinite(nextDose) || nextDose <= 0 || nextDose === recipe.dose) {
    return recipe;
  }

  const factor = nextDose / recipe.dose;

  return {
    ...recipe,
    dose: nextDose,
    water: scaleNumber(recipe.water, factor),
    brewWater:
      recipe.brewWater === undefined
        ? undefined
        : scaleNumber(recipe.brewWater, factor),
    bypassWater:
      recipe.bypassWater === undefined
        ? undefined
        : scaleWaterAmount(recipe.bypassWater, factor),
    finalWater:
      recipe.finalWater === undefined
        ? undefined
        : scaleWaterAmount(recipe.finalWater, factor),
    steps: recipe.steps.map((step) => ({
      ...step,
      targetWater: scaleNumber(step.targetWater, factor),
      displayTargetWater:
        step.displayTargetWater === undefined
          ? undefined
          : scaleWaterAmount(step.displayTargetWater, factor),
      displayStepWater:
        step.displayStepWater === undefined
          ? undefined
          : scaleWaterAmount(step.displayStepWater, factor),
    })),
  };
}
