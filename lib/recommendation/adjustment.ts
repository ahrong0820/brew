import { withUpdatedTimestamp } from "@/lib/domain/factories";
import {
  beanBrewProfileStore,
  brewSessionStore,
  grinderProfileStore,
} from "@/lib/storage/coffeeData";
import type {
  BeanBrewProfile,
  BrewSession,
  GrinderProfile,
  TastingResult,
} from "@/lib/types/coffee";

export type BrewAdjustmentVariable =
  | "grind"
  | "temperature"
  | "ratio"
  | "none";

export interface BrewAdjustmentSuggestion {
  sessionId: string;
  profileId: string;
  variable: BrewAdjustmentVariable;
  delta: number;
  title: string;
  currentValue: string;
  nextValue: string;
  reason: string;
  instruction: string;
  canApply: boolean;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function grinderUnit(profile: GrinderProfile) {
  if (profile.displayUnit === "dial") {
    return "다이얼";
  }

  if (profile.displayUnit === "click") {
    return "클릭";
  }

  return "Step";
}

function formatSetting(profile: GrinderProfile, value: number) {
  return profile.displayUnit === "dial" ? value.toFixed(1) : String(Math.round(value));
}

function grindStep(profile: GrinderProfile, deviationSeconds: number) {
  const largeDeviation = Math.abs(deviationSeconds) >= 30;

  if (profile.model === "1zpresso-k-ultra") {
    return largeDeviation ? 0.2 : 0.1;
  }

  if (profile.model === "baratza-encore") {
    return largeDeviation ? 2 : 1;
  }

  return largeDeviation
    ? Math.max(profile.displayStep ?? 1, (profile.displayStep ?? 1) * 2)
    : (profile.displayStep ?? 1);
}

function settingBounds(profile: GrinderProfile) {
  const points = profile.micronReference?.points ?? [];

  if (points.length > 0) {
    return {
      min: Math.min(...points.map((point) => point.step)) + profile.personalOffset,
      max: Math.max(...points.map((point) => point.step)) + profile.personalOffset,
    };
  }

  if (profile.model === "1zpresso-k-ultra") {
    return { min: 5.5, max: 8.5 };
  }

  if (profile.model === "baratza-encore") {
    return { min: 8, max: 32 };
  }

  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function canAdjustGrind(session: BrewSession, grinder: GrinderProfile | null) {
  return (
    grinder !== null &&
    session.recipeSnapshot.grindLevel !== undefined &&
    grinder.adjustmentDirection !== "unknown"
  );
}

function grindSuggestion(
  session: BrewSession,
  grinder: GrinderProfile,
  direction: "finer" | "coarser",
  deviationSeconds: number,
  reason: string,
): BrewAdjustmentSuggestion {
  const current = session.recipeSnapshot.grindLevel ?? 0;
  const movement = grindStep(grinder, deviationSeconds);
  const higherIsCoarser = grinder.adjustmentDirection === "higher-is-coarser";
  const signedDelta =
    direction === "coarser"
      ? higherIsCoarser
        ? movement
        : -movement
      : higherIsCoarser
        ? -movement
        : movement;
  const bounds = settingBounds(grinder);
  const rawNext = current + signedDelta;
  const next = bounds ? clamp(rawNext, bounds.min, bounds.max) : rawNext;
  const appliedDelta = next - current;
  const unit = grinderUnit(grinder);

  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "grind",
    delta: appliedDelta,
    title: direction === "finer" ? "분쇄도를 조금 더 곱게" : "분쇄도를 조금 더 굵게",
    currentValue: `${formatSetting(grinder, current)} ${unit}`,
    nextValue: `${formatSetting(grinder, next)} ${unit}`,
    reason,
    instruction: "다른 조건은 그대로 유지하고 분쇄도만 바꿔 비교하세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

function temperatureSuggestion(
  session: BrewSession,
  delta: number,
  reason: string,
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
    reason,
    instruction: "분쇄도와 푸어 구조는 그대로 유지하고 온도만 바꿔 비교하세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

function ratioSuggestion(
  session: BrewSession,
  delta: number,
  reason: string,
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
    reason,
    instruction: "원두량과 분쇄도는 그대로 두고 총 물량만 새 비율에 맞추세요.",
    canApply: Math.abs(appliedDelta) > 0.0001,
  };
}

function keepSuggestion(session: BrewSession, reason: string): BrewAdjustmentSuggestion {
  return {
    sessionId: session.id,
    profileId: session.profileId,
    variable: "none",
    delta: 0,
    title: "현재 조건 유지",
    currentValue: "변경 없음",
    nextValue: "같은 조건으로 한 번 더 재현",
    reason,
    instruction: "좋은 맛이 재현되는지 같은 조건으로 한 번 더 확인하세요.",
    canApply: false,
  };
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

export function createBrewAdjustmentSuggestion(
  sessionId: string,
): BrewAdjustmentSuggestion | null {
  const session = brewSessionStore.getById(sessionId);

  if (!session || !session.tastingResult) {
    return null;
  }

  const grinder = session.recipeSnapshot.grinderProfileId
    ? (grinderProfileStore.getById(session.recipeSnapshot.grinderProfileId) ?? null)
    : null;
  const actualTime = session.actualTimeSeconds;
  const minTime = session.recipeSnapshot.targetTimeMinSeconds;
  const maxTime = session.recipeSnapshot.targetTimeMaxSeconds;
  const result = session.tastingResult;

  if (result === "good") {
    return keepSuggestion(
      session,
      `${tastingReason(result)} 목표 시간보다 맛을 우선해 현재 조건을 유지합니다.`,
    );
  }

  if (actualTime !== undefined && actualTime < minTime - 10) {
    const deviation = actualTime - minTime;
    const reason = `${tastingReason(result)} 실제 시간 ${formatTime(actualTime)}이 목표 하한 ${formatTime(minTime)}보다 빨랐습니다.`;

    if (canAdjustGrind(session, grinder) && grinder) {
      return grindSuggestion(session, grinder, "finer", deviation, reason);
    }

    return temperatureSuggestion(session, 1, reason);
  }

  if (actualTime !== undefined && actualTime > maxTime + 10) {
    const deviation = actualTime - maxTime;
    const reason = `${tastingReason(result)} 실제 시간 ${formatTime(actualTime)}이 목표 상한 ${formatTime(maxTime)}보다 느렸습니다.`;

    if (canAdjustGrind(session, grinder) && grinder) {
      return grindSuggestion(session, grinder, "coarser", deviation, reason);
    }

    return temperatureSuggestion(session, -1, reason);
  }

  const reason = `${tastingReason(result)} 실제 추출 시간은 목표 범위와 크게 벗어나지 않았습니다.`;

  if (result === "too-sour" || result === "not-sweet-enough") {
    return temperatureSuggestion(session, 1, reason);
  }

  if (result === "bitter-astringent") {
    return temperatureSuggestion(session, -1, reason);
  }

  if (result === "too-weak") {
    return ratioSuggestion(session, -0.5, reason);
  }

  if (result === "too-strong") {
    return ratioSuggestion(session, 0.5, reason);
  }

  if (result === "aroma-muted" && canAdjustGrind(session, grinder) && grinder) {
    return grindSuggestion(session, grinder, "coarser", 0, reason);
  }

  return temperatureSuggestion(session, -1, reason);
}

export function applyBrewAdjustmentSuggestion(
  suggestion: BrewAdjustmentSuggestion,
): BeanBrewProfile {
  if (!suggestion.canApply || suggestion.variable === "none") {
    throw new Error("적용할 조정값이 없습니다.");
  }

  const profile = beanBrewProfileStore.getById(suggestion.profileId);

  if (!profile) {
    throw new Error("원두별 추출 프로필을 찾지 못했습니다.");
  }

  const offsetKey = suggestion.variable;
  const currentOffset = profile.recommendationOffset[offsetKey] ?? 0;
  const nextProfile = withUpdatedTimestamp<BeanBrewProfile>({
    ...profile,
    recommendationOffset: {
      ...profile.recommendationOffset,
      [offsetKey]: currentOffset + suggestion.delta,
    },
  });

  if (!beanBrewProfileStore.upsert(nextProfile)) {
    throw new Error("다음 추천 보정값을 저장하지 못했습니다.");
  }

  return nextProfile;
}
