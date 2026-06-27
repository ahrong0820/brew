import {
  applyBrewAdjustmentSuggestion,
  type BrewAdjustmentSuggestion,
} from "@/lib/recommendation/adjustment";
import { createAppliedRuleFromRegistry } from "@/lib/recommendation/ruleEvidence";
import { createSensoryAdjustmentSuggestion } from "@/lib/recommendation/sensoryAdjustment";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import type { AppliedRecommendationRule } from "@/lib/types/recommendation";

export type ValidatedAdjustmentSuggestion = BrewAdjustmentSuggestion & {
  appliedRule?: AppliedRecommendationRule;
};

const ruleId = "grind.v60-hot-paper.dial-in.v2";

function decorate(
  suggestion: BrewAdjustmentSuggestion,
  rule: AppliedRecommendationRule,
): ValidatedAdjustmentSuggestion {
  return {
    ...suggestion,
    reason: `${suggestion.reason} 시간 편차와 맛 신호가 같은 방향이라 검증된 HOT V60 분쇄도 규칙을 적용했습니다.`,
    instruction: "온도, 비율과 푸어 구조는 고정하고 분쇄도만 바꿔 비교하세요.",
    appliedRule: rule,
  };
}

export function createValidatedAdjustmentSuggestion(
  sessionId: string,
): ValidatedAdjustmentSuggestion | null {
  const suggestion = createSensoryAdjustmentSuggestion(sessionId);
  const session = brewSessionStore.getById(sessionId);
  if (!suggestion || !session?.tastingResult) return suggestion;

  const style = session.drinkStyle ?? session.recipeSnapshot.drinkStyle ?? "hot";
  if (session.recipeSnapshot.brewerType !== "v60" || style !== "hot") {
    return suggestion;
  }

  if (suggestion.variable !== "grind") return suggestion;
  return decorate(suggestion, createAppliedRuleFromRegistry(ruleId));
}

export { applyBrewAdjustmentSuggestion };
