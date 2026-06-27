import type {
  BrewAdjustmentAction,
  BrewAdjustmentTrial,
} from "@/lib/types/coffee";

export interface AdjustmentProgressionDecision {
  action: BrewAdjustmentAction;
  reason?: string;
}

export function actionVariable(action: BrewAdjustmentAction) {
  if (action === "finer" || action === "coarser") return "grind";
  if (action === "hotter" || action === "cooler") return "temperature";
  if (action === "less-water" || action === "more-water") return "ratio";
  return "none";
}

export function latestEvaluatedAdjustment(
  history: readonly BrewAdjustmentTrial[] | undefined,
) {
  return [...(history ?? [])].reverse().find((trial) => trial.outcome);
}
