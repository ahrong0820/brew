import type { Recipe } from "../types/defaultRecipe.ts";

export const defaultRecipeDoseMin = 8;
export const defaultRecipeDoseMax = 40;

export type RecipeDoseConstraints = Readonly<{
  min: number;
  max: number;
  fixed: boolean;
  note?: string;
}>;

export function getRecipeDoseConstraints(recipe: Recipe): RecipeDoseConstraints {
  const policy = recipe.dosePolicy;

  if (policy?.type === "fixed") {
    return {
      min: recipe.dose,
      max: recipe.dose,
      fixed: true,
      note: policy.note,
    };
  }

  return {
    min: policy?.min ?? defaultRecipeDoseMin,
    max: policy?.max ?? defaultRecipeDoseMax,
    fixed: false,
    note: policy?.note,
  };
}

export function clampRecipeDose(recipe: Recipe, value: number) {
  const constraints = getRecipeDoseConstraints(recipe);

  if (constraints.fixed) return recipe.dose;
  if (!Number.isFinite(value)) return constraints.min;

  return Math.min(
    constraints.max,
    Math.max(constraints.min, Math.round(value)),
  );
}
