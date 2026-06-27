import type { BrewAdjustmentVariable } from "@/lib/recommendation/adjustment";
import type { RecipeSnapshot, TastingResult } from "@/lib/types/coffee";

export type PersonalizationStage = "trial" | "provisional" | "stable";

export interface AdjustmentPresentationContext {
  sourceRecipeId?: string;
  recipeName: string;
  actualTimeSeconds?: number;
  targetTimeMinSeconds: number;
  targetTimeMaxSeconds: number;
  tastingResult?: TastingResult;
  tastingLabel: string;
  personalizationStage: PersonalizationStage;
  personalizationStageLabel: string;
  personalizationMessage: string;
  successfulSessionCount: number;
  totalSessionCount: number;
  fixedConditions: string[];
}

export function personalizationStageForSuccessCount(successCount: number): PersonalizationStage {
  if (successCount >= 2) return "stable";
  if (successCount === 1) return "provisional";
  return "trial";
}

export function fixedConditionLabels(
  variable: BrewAdjustmentVariable,
  snapshot: RecipeSnapshot,
) {
  const grind = `분쇄도 ${snapshot.grinderDisplayValue}`;
  const temperature = `온도 ${snapshot.temperatureCelsius}℃`;
  const ratio = `비율 1:${snapshot.ratio}`;
  const pour = "푸어 순서와 물줄기 유지";

  if (variable === "grind") return [temperature, ratio, pour];
  if (variable === "temperature") return [grind, ratio, pour];
  if (variable === "ratio") return [grind, temperature, pour];
  return [grind, temperature, ratio, pour];
}
