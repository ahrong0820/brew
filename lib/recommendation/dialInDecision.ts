import type { TastingResult } from "@/lib/types/coffee";

export type DialInDecision = "finer" | "coarser" | "hold";

/**
 * Legacy rule helper retained for registry and historical tests.
 * Live post-brew guidance uses the user's brewPaceAssessment instead.
 */
export function decideDialIn(input: {
  actualSeconds: number;
  minimumSeconds: number;
  maximumSeconds: number;
  tastingResult: TastingResult;
}): DialInDecision {
  if (input.tastingResult === "good") return "hold";
  if (input.actualSeconds < input.minimumSeconds - 10) return "finer";
  if (input.actualSeconds > input.maximumSeconds + 10) return "coarser";
  if (input.tastingResult === "bitter-astringent") return "coarser";
  return "hold";
}
