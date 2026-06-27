import { decideAdjustmentAction } from "@/lib/recommendation/adjustmentPolicy";
import type {
  BrewPaceAssessment,
  TastingResult,
} from "@/lib/types/coffee";

export type DialInDecision = "finer" | "coarser" | "hold";

export function decideDialIn(input: {
  actualSeconds: number;
  minimumSeconds: number;
  maximumSeconds: number;
  tastingResult: TastingResult;
}): DialInDecision {
  const brewPaceAssessment: BrewPaceAssessment =
    input.actualSeconds < input.minimumSeconds - 10
      ? "fast"
      : input.actualSeconds > input.maximumSeconds + 10
        ? "slow"
        : "in-range";
  const action = decideAdjustmentAction({
    brewPaceAssessment,
    tastingResult: input.tastingResult,
  });

  if (action === "finer" || action === "coarser") return action;
  return "hold";
}
