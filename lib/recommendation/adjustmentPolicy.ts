import {
  diagnoseTaste,
  type SensoryIssue,
} from "./diagnosisMatrix.ts";
import type {
  BrewAdjustmentAction,
  BrewPaceAssessment,
  BrewerType,
  TastingResult,
} from "@/lib/types/coffee";

export type AdjustmentAction = BrewAdjustmentAction;

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

export function decideAdjustmentAction(
  input: AdjustmentPolicyInput,
): AdjustmentAction {
  return diagnoseTaste({
    brewerType: input.brewerType ?? "v60",
    brewPaceAssessment: input.brewPaceAssessment,
    issues: issuesForTaste(input.tastingResult),
  }).direction;
}
