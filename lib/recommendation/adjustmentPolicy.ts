import type { TastingResult } from "@/lib/types/coffee";

export type AdjustmentAction =
  | "hold"
  | "finer"
  | "coarser"
  | "hotter"
  | "cooler"
  | "less-water"
  | "more-water";

export interface AdjustmentPolicyInput {
  actualSeconds: number;
  minimumSeconds: number;
  maximumSeconds: number;
  tastingResult: TastingResult;
}

const timeToleranceSeconds = 10;
const largeDeviationSeconds = 30;

export function decideAdjustmentAction(
  input: AdjustmentPolicyInput,
): AdjustmentAction {
  if (input.tastingResult === "good") return "hold";
  if (input.tastingResult === "too-weak") return "less-water";
  if (input.tastingResult === "too-strong") return "more-water";

  const fasterBy = input.minimumSeconds - input.actualSeconds;
  const slowerBy = input.actualSeconds - input.maximumSeconds;
  const clearlyFast = fasterBy > timeToleranceSeconds;
  const clearlySlow = slowerBy > timeToleranceSeconds;
  const veryFast = fasterBy >= largeDeviationSeconds;
  const verySlow = slowerBy >= largeDeviationSeconds;

  if (clearlyFast) {
    if (input.tastingResult === "bitter-astringent") return "cooler";
    if (input.tastingResult === "aroma-muted") {
      return veryFast ? "finer" : "hotter";
    }
    return veryFast ? "finer" : "hotter";
  }

  if (clearlySlow) {
    if (
      input.tastingResult === "too-sour" ||
      input.tastingResult === "not-sweet-enough"
    ) {
      return "hotter";
    }
    if (input.tastingResult === "aroma-muted") return "coarser";
    if (input.tastingResult === "bitter-astringent") {
      return verySlow ? "coarser" : "cooler";
    }
  }

  if (
    input.tastingResult === "too-sour" ||
    input.tastingResult === "not-sweet-enough"
  ) {
    return "hotter";
  }
  if (input.tastingResult === "bitter-astringent") return "cooler";
  if (input.tastingResult === "aroma-muted") return "coarser";

  return "hold";
}
