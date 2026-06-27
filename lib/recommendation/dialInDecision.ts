import { decideAdjustmentAction } from "@/lib/recommendation/adjustmentPolicy";
import type { TastingResult } from "@/lib/types/coffee";

export type DialInDecision = "finer" | "coarser" | "hold";

export function decideDialIn(input: {
  actualSeconds: number;
  minimumSeconds: number;
  maximumSeconds: number;
  tastingResult: TastingResult;
}): DialInDecision {
  const action = decideAdjustmentAction(input);
  if (action === "finer" || action === "coarser") return action;
  return "hold";
}
