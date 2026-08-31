import type { WaterAmount } from "@/lib/types/defaultRecipe";

export function formatRecipeTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function scaleRecipeValue(value: number, factor: number) {
  return Math.round(value * factor);
}

export function formatRecipeWaterAmount(amount: WaterAmount, factor = 1) {
  if (typeof amount === "number") {
    return `${scaleRecipeValue(amount, factor)}g`;
  }

  return `${scaleRecipeValue(amount.min, factor)}-${scaleRecipeValue(amount.max, factor)}g`;
}
