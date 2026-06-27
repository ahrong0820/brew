import { withUpdatedTimestamp } from "@/lib/domain/factories";
import { createSensoryAdjustmentSuggestion } from "@/lib/recommendation/sensoryAdjustment";
import { createLocalId } from "@/lib/storage/ids";
import { beanBrewProfileStore } from "@/lib/storage/coffeeData";
import type {
  BeanBrewProfile,
  BrewAdjustmentAction,
  BrewAdjustmentTrial,
  BrewAdjustmentVariable,
} from "@/lib/types/coffee";

export type { BrewAdjustmentAction, BrewAdjustmentVariable } from "@/lib/types/coffee";

export interface BrewAdjustmentSuggestion {
  sessionId: string;
  profileId: string;
  variable: BrewAdjustmentVariable;
  action: BrewAdjustmentAction;
  delta: number;
  title: string;
  currentValue: string;
  nextValue: string;
  reason: string;
  instruction: string;
  canApply: boolean;
  progressionReason?: string;
}

/**
 * Compatibility export for callers that still use the original adjustment entry point.
 * Live guidance and legacy callers now share the sensory and user-pace policy.
 */
export function createBrewAdjustmentSuggestion(
  sessionId: string,
): BrewAdjustmentSuggestion | null {
  return createSensoryAdjustmentSuggestion(sessionId);
}

function pendingTrial(profile: BeanBrewProfile) {
  if (!profile.pendingAdjustmentId) return undefined;
  return (profile.adjustmentHistory ?? []).find(
    (trial) => trial.id === profile.pendingAdjustmentId && !trial.outcome,
  );
}

export function applyBrewAdjustmentSuggestion(
  suggestion: BrewAdjustmentSuggestion,
): BeanBrewProfile {
  if (
    !suggestion.canApply ||
    suggestion.variable === "none" ||
    suggestion.action === "hold"
  ) {
    throw new Error("적용할 조정값이 없습니다.");
  }

  const profile = beanBrewProfileStore.getById(suggestion.profileId);
  if (!profile) {
    throw new Error("원두별 추출 프로필을 찾지 못했습니다.");
  }

  if (pendingTrial(profile)) {
    throw new Error(
      "이미 적용한 조정안의 결과 평가가 남아 있습니다. 다음 추출을 평가한 뒤 새 조정을 적용하세요.",
    );
  }

  const timestamp = new Date().toISOString();
  const offsetKey = suggestion.variable;
  const currentOffset = profile.recommendationOffset[offsetKey] ?? 0;
  const trial: BrewAdjustmentTrial = {
    id: createLocalId("adjustment"),
    sourceSessionId: suggestion.sessionId,
    variable: suggestion.variable,
    action: suggestion.action,
    delta: suggestion.delta,
    currentValue: suggestion.currentValue,
    nextValue: suggestion.nextValue,
    appliedAt: timestamp,
  };
  const history = [...(profile.adjustmentHistory ?? []), trial].slice(-50);
  const nextProfile = withUpdatedTimestamp<BeanBrewProfile>(
    {
      ...profile,
      recommendationOffset: {
        ...profile.recommendationOffset,
        [offsetKey]: currentOffset + suggestion.delta,
      },
      adjustmentHistory: history,
      pendingAdjustmentId: trial.id,
    },
    timestamp,
  );

  if (!beanBrewProfileStore.upsert(nextProfile)) {
    throw new Error("다음 추천 보정값을 저장하지 못했습니다.");
  }

  return nextProfile;
}
