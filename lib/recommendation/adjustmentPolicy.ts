import type {
  BrewPaceAssessment,
  TastingResult,
} from "@/lib/types/coffee";

export type AdjustmentAction =
  | "hold"
  | "finer"
  | "coarser"
  | "hotter"
  | "cooler"
  | "less-water"
  | "more-water";

export interface AdjustmentPolicyInput {
  brewPaceAssessment?: BrewPaceAssessment;
  tastingResult: TastingResult;
}

export function decideAdjustmentAction(
  input: AdjustmentPolicyInput,
): AdjustmentAction {
  const pace = input.brewPaceAssessment;
  const taste = input.tastingResult;

  if (taste === "good") return "hold";
  if (taste === "too-weak") return "less-water";
  if (taste === "too-strong") return "more-water";

  if (pace === "fast") {
    if (taste === "bitter-astringent") return "cooler";
    return "finer";
  }

  if (pace === "slow") {
    if (taste === "too-sour" || taste === "not-sweet-enough") {
      return "hotter";
    }
    return "coarser";
  }

  if (taste === "too-sour" || taste === "not-sweet-enough") {
    return "hotter";
  }
  if (taste === "bitter-astringent") return "cooler";
  if (taste === "aroma-muted") return "coarser";

  return "hold";
}
