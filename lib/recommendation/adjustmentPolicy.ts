import {
  diagnoseTaste,
  type DiagnosisDirection,
  type SensoryIssue,
} from "./diagnosisMatrix.ts";
import type {
  BrewPaceAssessment,
  BrewerType,
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
  brewerType?: BrewerType;
  tastingResult: TastingResult;
}

function issuesForTaste(taste: TastingResult): SensoryIssue[] {
  if (taste === "too-sour") return ["sour"];
  if (taste === "not-sweet-enough") return ["sweetness-low"];
  if (taste === "bitter-astringent") return ["bitter", "astringent"];
  if (taste === "too-weak") return ["weak"];
  if (taste === "too-strong") return ["strong"];
  if (taste === "aroma-muted") return ["aroma-muted"];
  return [];
}

function supportedAction(direction: DiagnosisDirection): AdjustmentAction {
  if (
    direction === "hold" ||
    direction === "finer" ||
    direction === "coarser" ||
    direction === "hotter" ||
    direction === "cooler" ||
    direction === "less-water" ||
    direction === "more-water"
  ) {
    return direction;
  }
  if (direction === "longer-immersion" || direction === "more-agitation") {
    return "hotter";
  }
  return "cooler";
}

export function decideAdjustmentAction(
  input: AdjustmentPolicyInput,
): AdjustmentAction {
  const diagnosis = diagnoseTaste({
    brewerType: input.brewerType ?? "v60",
    brewPaceAssessment: input.brewPaceAssessment,
    issues: issuesForTaste(input.tastingResult),
  });
  return supportedAction(diagnosis.direction);
}
