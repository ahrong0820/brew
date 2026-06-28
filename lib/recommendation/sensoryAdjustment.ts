import type { BrewAdjustmentSuggestion } from "@/lib/recommendation/adjustment";
import { decideAdjustmentAction } from "@/lib/recommendation/adjustmentPolicy";
import { latestEvaluatedAdjustment } from "@/lib/recommendation/adjustmentProgression";
import { decideAdjustmentProgression } from "@/lib/recommendation/adjustmentProgressionDecision";
import { grinderSafeRange } from "@/lib/recommendation/grindRecommendationV2";
import {
  beanBrewProfileStore,
  brewSessionStore,
  grinderProfileStore,
} from "@/lib/storage/coffeeData";
import type {
  BrewAdjustmentAction,
  BrewPaceAssessment,
  BrewSession,
  GrinderProfile,
  TastingResult,
} from "@/lib/types/coffee";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function paceLabel(pace: BrewPaceAssessment | undefined) {
  if (pace === "fast") return "사용자가 추출이 빠르다고 평가했습니다.";
  if (pace === "slow") return "사용자가 추출이 느리다고 평가했습니다.";
  if (pace === "in-range") return "사용자가 추출 속도가 적정하다고 평가했습니다.";
  return "추출 속도 평가는 기록되지 않았습니다.";
}

function tastingReason(result: TastingResult) {
  const labels: Record<TastingResult, string> = {
    good: "맛 평가가 좋음으로 기록되었습니다.",
    "too-sour": "시고 덜 추출된 느낌이 기록되었습니다.",
    "not-sweet-enough": "단맛이 부족하다고 기록되었습니다.",
    "bitter-astringent": "쓰고 떫은 느낌이 기록되었습니다.",
    "too-weak": "농도가 너무 연하다고 기록되었습니다.",
    "too-strong": "농도가 높고 무겁다고 기록되었습니다.",
    "aroma-muted": "향이 답답하다고 기록되었습니다.",
  };
  return labels[result];
}

function diagnosticReason(session: BrewSession) {
  if (!session.tastingResult) return paceLabel(session.brewPaceAssessment);
  return `${paceLabel(session.brewPaceAssessment)} ${tastingReason(session.tastingResult)}`;
}

function grinderUnit(profile: GrinderProfile) {
  if (profile.displayUnit === "dial") return "다이얼";
  if (profile.displayUnit === "click") return "클릭";
  return "Step";
}

function formatSetting(profile: GrinderProfile, value: number) {
  return profile.displayUnit === "dial" ? value.toFixed(1) : String(Math.round(value));
}

function grindStep(profile: GrinderProfile) {
  if (profile.model === "1zpresso-k-ultra") return 0.1;
  if (profile.model === "baratza-encore") return 1;
  return profile.displayStep ?? 1;
}

function settingBounds(profile: GrinderProfile) {
  const range = grinderSafeRange(profile);
  return range ? { min: range.min, max: range.max } : null;
}

function grindSuggestion(
  session: BrewSession,
  action: "finer" | "coarser",
): BrewAdjustmentSuggestion | null {
  const grinderId = session.recipeSnapshot.grinderProfileId;
  const current = session.recipeSnapshot.grindLevel;
  if (!grinderId || current === undefined) return null;
  const grinder = grinderProfileStore.getById(grinderId);
  if (!grinder || grinder.adjustmentDirection === "unknown") return null;

  const movement = grindStep(grinder);
  const higherIsCoarser = grinder.adjustmentDirection === "higher-is-coarser";
  const signedDelta =
    action === "coarser"
      ? higherIsCoarser
        ? movement
        : -movement
      : higherIsCoarser
        ? -movement
        : movement;
  const bounds = settingBounds(grinder);
  const next = bounds
    ? clamp(current + signedDelta, bounds.min, bounds.max)
    : current + signedDelta;
  const appliedDelta = next - current;
  const unit = grinderUnit(grinder);

  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "grind",
    action,
    delta: appliedDelta,
    title: action === "finer" ? "분쇄도를 조금 더 곱게" : "분쇄도를 조금 더 굵게",
    currentValue: `${formatSetting(grinder, current)} ${unit}`,
    nextValue: `${formatSetting(grinder, next)} ${unit}`,
    reason: diagnosticReason(session),
    instruction: "온도, 비율과 푸어 구조는 그대로 유지하고 분쇄도만 바꿔 비교하세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

function temperatureSuggestion(
  session: BrewSession,
  action: "hotter" | "cooler",
): BrewAdjustmentSuggestion {
  const current = session.recipeSnapshot.temperatureCelsius;
  const next = clamp(current + (action === "hotter" ? 1 : -1), 82, 96);
  const appliedDelta = next - current;

  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "temperature",
    action,
    delta: appliedDelta,
    title: action === "hotter" ? "물 온도를 1℃ 높이기" : "물 온도를 1℃ 낮추기",
    currentValue: `${current}℃`,
    nextValue: `${next}℃`,
    reason: diagnosticReason(session),
    instruction: "분쇄도, 비율과 푸어 구조는 그대로 유지하고 온도만 바꿔 비교하세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

function ratioSuggestion(
  session: BrewSession,
  action: "less-water" | "more-water",
): BrewAdjustmentSuggestion {
  const current = session.recipeSnapshot.ratio;
  const next = clamp(
    Math.round((current + (action === "less-water" ? -0.5 : 0.5)) * 2) / 2,
    13,
    18,
  );
  const appliedDelta = next - current;

  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "ratio",
    action,
    delta: appliedDelta,
    title: action === "more-water" ? "물 비율을 조금 늘리기" : "물 비율을 조금 줄이기",
    currentValue: `1:${current}`,
    nextValue: `1:${next}`,
    reason: diagnosticReason(session),
    instruction: "원두량, 분쇄도, 온도와 푸어 구조는 그대로 두고 총 물량만 새 비율에 맞추세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

function keepSuggestion(session: BrewSession): BrewAdjustmentSuggestion {
  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "none",
    action: "hold",
    delta: 0,
    title: "현재 조건 유지",
    currentValue: "변경 없음",
    nextValue: "같은 조건으로 한 번 더 재현",
    reason: diagnosticReason(session),
    instruction: "좋은 맛이 재현되는지 같은 조건으로 한 번 더 확인하세요.",
    canApply: false,
  };
}

function suggestionForAction(
  session: BrewSession,
  action: BrewAdjustmentAction,
) {
  if (action === "finer" || action === "coarser") {
    return (
      grindSuggestion(session, action) ??
      temperatureSuggestion(session, action === "finer" ? "hotter" : "cooler")
    );
  }
  if (action === "hotter" || action === "cooler") {
    return temperatureSuggestion(session, action);
  }
  if (action === "less-water" || action === "more-water") {
    return ratioSuggestion(session, action);
  }
  return keepSuggestion(session);
}

export function createSensoryAdjustmentSuggestion(
  sessionId: string,
): BrewAdjustmentSuggestion | null {
  const session = brewSessionStore.getById(sessionId);
  if (!session?.tastingResult) return null;

  const baseAction = decideAdjustmentAction({
    brewPaceAssessment: session.brewPaceAssessment,
    tastingResult: session.tastingResult,
  });
  const profile = beanBrewProfileStore.getById(session.profileId);
  const decision = decideAdjustmentProgression({
    baseAction,
    previous: latestEvaluatedAdjustment(profile?.adjustmentHistory),
    history: profile?.adjustmentHistory,
    brewPaceAssessment: session.brewPaceAssessment,
    tastingResult: session.tastingResult,
  });
  const suggestion = suggestionForAction(session, decision.action);

  return decision.reason
    ? {
        ...suggestion,
        reason: `${decision.reason} ${suggestion.reason}`,
        progressionReason: decision.reason,
      }
    : suggestion;
}
