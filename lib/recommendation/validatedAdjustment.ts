import {
  applyBrewAdjustmentSuggestion,
  createBrewAdjustmentSuggestion as baselineSuggestion,
  type BrewAdjustmentSuggestion,
} from "@/lib/recommendation/adjustment";
import { decideDialIn } from "@/lib/recommendation/dialInDecision";
import { createAppliedRuleFromRegistry } from "@/lib/recommendation/ruleEvidence";
import { brewSessionStore, grinderProfileStore } from "@/lib/storage/coffeeData";
import type { AppliedRecommendationRule } from "@/lib/types/recommendation";

export type ValidatedAdjustmentSuggestion = BrewAdjustmentSuggestion & {
  appliedRule?: AppliedRecommendationRule;
};

const ruleId = "grind.v60-hot-paper.dial-in.v1";

function decorate(
  suggestion: BrewAdjustmentSuggestion,
  rule: AppliedRecommendationRule,
): ValidatedAdjustmentSuggestion {
  return {
    ...suggestion,
    reason: `${suggestion.reason} 검증된 HOT V60 분쇄도 규칙을 적용했습니다.`,
    instruction:
      suggestion.variable === "grind"
        ? "다른 조건은 고정하고 분쇄도만 바꿔 비교하세요."
        : suggestion.instruction,
    appliedRule: rule,
  };
}

function coarserForAstringency(
  sessionId: string,
  rule: AppliedRecommendationRule,
): ValidatedAdjustmentSuggestion | null {
  const session = brewSessionStore.getById(sessionId);
  if (!session) return null;
  const grinderId = session.recipeSnapshot.grinderProfileId;
  const current = session.recipeSnapshot.grindLevel;
  if (!grinderId || current === undefined) return null;
  const grinder = grinderProfileStore.getById(grinderId);
  if (!grinder || grinder.adjustmentDirection === "unknown") return null;

  const step =
    grinder.model === "1zpresso-k-ultra"
      ? 0.1
      : grinder.model === "baratza-encore"
        ? 1
        : (grinder.displayStep ?? 1);
  const delta =
    grinder.adjustmentDirection === "higher-is-coarser" ? step : -step;
  const next = current + delta;
  const format = (value: number) =>
    grinder.displayUnit === "dial" ? value.toFixed(1) : String(Math.round(value));
  const unit =
    grinder.displayUnit === "dial"
      ? "다이얼"
      : grinder.displayUnit === "click"
        ? "클릭"
        : "Step";

  return {
    sessionId,
    profileId: session.profileId,
    variable: "grind",
    delta,
    title: "분쇄도를 조금 더 굵게",
    currentValue: `${format(current)} ${unit}`,
    nextValue: `${format(next)} ${unit}`,
    reason: "목표 시간 안에서 떫은 감각이 기록되어 분쇄도를 굵게 되돌립니다.",
    instruction: "다른 조건은 고정하고 분쇄도만 바꿔 비교하세요.",
    canApply: true,
    appliedRule: rule,
  };
}

export function createValidatedAdjustmentSuggestion(
  sessionId: string,
): ValidatedAdjustmentSuggestion | null {
  const baseline = baselineSuggestion(sessionId);
  const session = brewSessionStore.getById(sessionId);
  if (!session?.tastingResult || session.actualTimeSeconds === undefined) return baseline;
  const style = session.drinkStyle ?? session.recipeSnapshot.drinkStyle ?? "hot";
  if (session.recipeSnapshot.brewerType !== "v60" || style !== "hot") return baseline;

  const decision = decideDialIn({
    actualSeconds: session.actualTimeSeconds,
    minimumSeconds: session.recipeSnapshot.targetTimeMinSeconds,
    maximumSeconds: session.recipeSnapshot.targetTimeMaxSeconds,
    tastingResult: session.tastingResult,
  });
  const rule = createAppliedRuleFromRegistry(ruleId);

  if (decision === "hold") {
    return session.tastingResult === "good" && baseline
      ? decorate(baseline, rule)
      : baseline;
  }
  if (baseline?.variable === "grind") return decorate(baseline, rule);
  if (decision === "coarser" && session.tastingResult === "bitter-astringent") {
    return coarserForAstringency(sessionId, rule) ?? baseline;
  }
  return baseline;
}

export { applyBrewAdjustmentSuggestion };
