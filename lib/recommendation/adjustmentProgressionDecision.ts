import { actionVariable } from "./adjustmentProgression.ts";
import type {
  BrewAdjustmentAction,
  BrewAdjustmentTrial,
  BrewPaceAssessment,
  BrewerType,
  TastingResult,
} from "@/lib/types/coffee";

const maxRepeatedGrindAdjustments = 2;

function reverseAction(
  action: Exclude<BrewAdjustmentAction, "hold">,
): Exclude<BrewAdjustmentAction, "hold"> {
  if (action === "finer") return "coarser";
  if (action === "coarser") return "finer";
  if (action === "hotter") return "cooler";
  if (action === "cooler") return "hotter";
  if (action === "less-water") return "more-water";
  if (action === "more-water") return "less-water";
  if (action === "less-agitation") return "more-agitation";
  if (action === "more-agitation") return "less-agitation";
  if (action === "shorter-immersion") return "longer-immersion";
  if (action === "longer-immersion") return "shorter-immersion";
  if (action === "gentler-pour") return "stronger-pour";
  return "gentler-pour";
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

function cleverTechniqueAction(taste: TastingResult): BrewAdjustmentAction {
  if (taste === "too-sour" || taste === "not-sweet-enough") {
    return "longer-immersion";
  }
  if (taste === "bitter-astringent" || taste === "aroma-muted") {
    return "less-agitation";
  }
  if (taste === "too-weak") return "less-water";
  if (taste === "too-strong") return "more-water";
  return "hold";
}

function alternateAction(input: {
  previous: BrewAdjustmentTrial;
  baseAction: BrewAdjustmentAction;
  brewerType?: BrewerType;
  pace?: BrewPaceAssessment;
  taste: TastingResult;
}) {
  if (input.previous.variable === "grind") {
    return input.brewerType === "clever"
      ? cleverTechniqueAction(input.taste)
      : temperatureAction(input.taste);
  }
  if (input.previous.variable === "temperature") {
    return grindAction(input.pace, input.taste);
  }
  const next = temperatureAction(input.taste);
  return next === "hold" ? input.baseAction : next;
}

function repeatedNonWorseActionCount(
  history: readonly BrewAdjustmentTrial[] | undefined,
  action: Exclude<BrewAdjustmentAction, "hold">,
) {
  let count = 0;
  for (const trial of [...(history ?? [])].reverse()) {
    if (!trial.outcome) continue;
    if (trial.action === action && trial.outcome !== "worse") {
      count += 1;
      continue;
    }
    break;
  }
  return count;
}

export function decideAdjustmentProgression(input: {
  baseAction: BrewAdjustmentAction;
  previous?: BrewAdjustmentTrial;
  history?: readonly BrewAdjustmentTrial[];
  brewerType?: BrewerType;
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
    if (actionVariable(input.baseAction) !== previous.variable) {
      return { action: input.baseAction };
    }
    const repeatedCount = repeatedNonWorseActionCount(
      input.history,
      previous.action,
    );
    if (
      previous.variable === "grind" &&
      repeatedCount >= maxRepeatedGrindAdjustments
    ) {
      const action = alternateAction({
        previous,
        baseAction: input.baseAction,
        brewerType: input.brewerType,
        pace: input.brewPaceAssessment,
        taste: input.tastingResult,
      });
      return {
        action,
        reason:
          input.brewerType === "clever"
            ? "분쇄도를 같은 방향으로 두 번 연속 시험했으므로 추가 분쇄 변경 대신 클레버 침출 시간·교반·비율 중 한 변수로 전환합니다."
            : "분쇄도를 같은 방향으로 두 번 연속 시험했고 개선이 제한적이므로 추가 분쇄 변경 대신 온도 또는 비율 한 변수로 전환합니다.",
      };
    }
    return {
      action: previous.action,
      reason: "직전 조정 후 개선되어 같은 방향을 한 단계 더 시험합니다.",
    };
  }
  if (actionVariable(input.baseAction) !== previous.variable) {
    return { action: input.baseAction };
  }
  const action = alternateAction({
    previous,
    baseAction: input.baseAction,
    brewerType: input.brewerType,
    pace: input.brewPaceAssessment,
    taste: input.tastingResult,
  });
  return {
    action,
    reason: "직전 조정으로 차이가 없어 다른 한 변수로 전환합니다.",
  };
}
