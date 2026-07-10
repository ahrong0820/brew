import type { Recipe, RecipeTemperature } from "../types/defaultRecipe.ts";

export function recipeTemperaturePresentation(recipe: Pick<Recipe, "temp" | "temperature">) {
  const temperature = recipe.temperature;
  if (!temperature) {
    return {
      display: recipe.temp,
      status: "legacy" as const,
      statusLabel: "레시피 표기",
      note: null,
    };
  }

  return {
    display: temperature.display,
    status: temperature.status,
    statusLabel:
      temperature.status === "verified"
        ? "공식 확인값"
        : temperature.status === "app-default"
          ? "앱 시작값"
          : "확인 필요",
    note: temperature.note ?? null,
  };
}

export function isRunnableTemperature(
  temperature: RecipeTemperature | undefined,
  fallbackDisplay: string,
) {
  if (!temperature) return fallbackDisplay.trim().length > 0;
  if (temperature.status === "unknown") return false;
  if (temperature.status === "app-default") {
    return Number.isFinite(temperature.celsius) && temperature.celsius > 0;
  }
  return temperature.display.trim().length > 0;
}
