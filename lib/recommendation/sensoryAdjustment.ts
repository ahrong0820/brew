import {
  createBrewAdjustmentSuggestion,
  type BrewAdjustmentSuggestion,
} from "@/lib/recommendation/adjustment";
import { decideAdjustmentAction } from "@/lib/recommendation/adjustmentPolicy";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import type { BrewSession, TastingResult } from "@/lib/types/coffee";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function tastingReason(result: TastingResult) {
  const labels: Record<TastingResult, string> = {
    good: "맛 평가가 좋음으로 기록되었습니다.",
    "too-sour": "시고 덜 추출된 느낌이 기록되었습니다.",
    "not-sweet-enough": "단맛이 부족하다고 기록되었습니다.",
    "bitter-astringent": "쓰고 떫은 느낌이 기록되었습니다.",
    "too-weak": "농도가 너무 연하다고 기록되었습니다.",
    "too-strong": "농도가 너무 진하다고 기록되었습니다.",
    "aroma-muted": "향이 답답하다고 기록되었습니다.",
  };
  return labels[result];
}

function diagnosticReason(session: BrewSession) {
  const result = session.tastingResult;
  if (!result) return "맛 평가가 없습니다.";
  const actual = session.actualTimeSeconds;
  const minimum = session.recipeSnapshot.targetTimeMinSeconds;
  const maximum = session.recipeSnapshot.targetTimeMaxSeconds;

  if (actual === undefined) return tastingReason(result);
  if (actual < minimum - 10) {
    return `${tastingReason(result)} 실제 시간 ${formatTime(actual)}은 목표 하한 ${formatTime(minimum)}보다 빠르지만 맛 신호와 함께 판단했습니다.`;
  }
  if (actual > maximum + 10) {
    return `${tastingReason(result)} 실제 시간 ${formatTime(actual)}은 목표 상한 ${formatTime(maximum)}보다 느리지만 맛 신호와 함께 판단했습니다.`;
  }
  return `${tastingReason(result)} 실제 추출 시간은 목표 범위와 크게 벗어나지 않았습니다.`;
}

function temperatureSuggestion(
  session: BrewSession,
  delta: number,
): BrewAdjustmentSuggestion {
  const current = session.recipeSnapshot.temperatureCelsius;
  const next = clamp(current + delta, 82, 96);
  const appliedDelta = next - current;

  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "temperature",
    delta: appliedDelta,
    title: appliedDelta > 0 ? "물 온도를 1℃ 높이기" : "물 온도를 1℃ 낮추기",
    currentValue: `${current}℃`,
    nextValue: `${next}℃`,
    reason: diagnosticReason(session),
    instruction: "분쇄도, 비율과 푸어 구조는 그대로 유지하고 온도만 바꿔 비교하세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

function ratioSuggestion(
  session: BrewSession,
  delta: number,
): BrewAdjustmentSuggestion {
  const current = session.recipeSnapshot.ratio;
  const next = clamp(Math.round((current + delta) * 2) / 2, 13, 18);
  const appliedDelta = next - current;

  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "ratio",
    delta: appliedDelta,
    title: appliedDelta > 0 ? "물 비율을 조금 늘리기" : "물 비율을 조금 줄이기",
    currentValue: `1:${current}`,
    nextValue: `1:${next}`,
    reason: diagnosticReason(session),
    instruction: "원두량, 분쇄도, 온도와 푸어 구조는 그대로 두고 총 물량만 새 비율에 맞추세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

export function createSensoryAdjustmentSuggestion(
  sessionId: string,
): BrewAdjustmentSuggestion | null {
  const baseline = createBrewAdjustmentSuggestion(sessionId);
  const session = brewSessionStore.getById(sessionId);
  if (!baseline || !session?.tastingResult) return baseline;
  if (session.actualTimeSeconds === undefined) return baseline;

  const action = decideAdjustmentAction({
    actualSeconds: session.actualTimeSeconds,
    minimumSeconds: session.recipeSnapshot.targetTimeMinSeconds,
    maximumSeconds: session.recipeSnapshot.targetTimeMaxSeconds,
    tastingResult: session.tastingResult,
  });

  if (action === "hotter") return temperatureSuggestion(session, 1);
  if (action === "cooler") return temperatureSuggestion(session, -1);
  if (action === "less-water") return ratioSuggestion(session, -0.5);
  if (action === "more-water") return ratioSuggestion(session, 0.5);

  return baseline;
}
