import { actionVariable } from "@/lib/recommendation/adjustmentProgression";
import type {
  BrewAdjustmentAction,
  BrewAdjustmentTrial,
  BrewPaceAssessment,
  TastingResult,
} from "@/lib/types/coffee";

function reverseAction(action: Exclude<BrewAdjustmentAction, "hold">) {
  if (action === "finer") return "coarser" as const;
  if (action === "coarser") return "finer" as const;
  if (action === "hotter") return "cooler" as const;
  if (action === "cooler") return "hotter" as const;
  if (action === "less-water") return "more-water" as const;
  return "less-water" as const;
}

function temperatureAction(taste: TastingResult): BrewAdjustmentAction {
  if (taste === "too-sour" || taste === "not-sweet-enough") return "hotter";
  if (taste === "bitter-astringent" || taste === "aroma-muted") return "cooler";
  if (taste === "too-weak") return "less-water";
  if (taste === "too-strong") return "more-water";
  return "hold";
}

function grindAction(
  pace: BrewPaceAssessment | undefined,
  taste: TastingResult,
): BrewAdjustmentAction {
  if (pace === "fast") return "finer";
  if (pace === "slow") return "coarser";
  if (taste === "too-sour" || taste === "not-sweet-enough") return "finer";
  if (taste === "bitter-astringent" || taste === "aroma-muted") return "coarser";
  if (taste === "too-weak") return "less-water";
  if (taste === "too-strong") return "more-water";
  return "hold";
}

function alternateAction(input: {
  previous: BrewAdjustmentTrial;
  baseAction: BrewAdjustmentAction;
  pace?: BrewPaceAssessment;
  taste: TastingResult;
}) {
  if (input.previous.variable === "grind") return temperatureAction(input.taste);
  if (input.previous.variable === "temperature") {
    return grindAction(input.pace, input.taste);
  }
  const next = temperatureAction(input.taste);
  return next === "hold" ? input.baseAction : next;
}

export function decideAdjustmentProgression(input: {
  baseAction: BrewAdjustmentAction;
  previous?: BrewAdjustmentTrial;
  brewPaceAssessment?: BrewPaceAssessment;
  tastingResult: TastingResult;
}) {
  const previous = input.previous;
  if (!previous?.outcome || input.baseAction === "hold") {
    return { action: input.baseAction };
  }
  if (previous.outcome === "worse") {
    return {
      action: reverseAction(previous.action),
      reason: "직전 조정 후 맛이 나빠져 해당 변경을 먼저 되돌립니다.",
    };
  }
  if (previous.outcome === "improved") {
    return actionVariable(input.baseAction) === previous.variable
      ? {
          action: previous.action,
          reason: "직전 조정 후 개선되어 같은 방향을 한 단계 더 시험합니다.",
        }
      : { action: input.baseAction };
  }
  if (actionVariable(input.baseAction) !== previous.variable) {
    return { action: input.baseAction };
  }
  const action = alternateAction({
    previous,
    baseAction: input.baseAction,
    pace: input.brewPaceAssessment,
    taste: input.tastingResult,
  });
  return {
    action,
    reason: "직전 조정으로 차이가 없어 다른 한 변수로 전환합니다.",
  };
}
