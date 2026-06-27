import { withUpdatedTimestamp } from "@/lib/domain/factories";
import { beanBrewProfileStore } from "@/lib/storage/coffeeData";
import type {
  BeanBrewProfile,
  BrewAdjustmentOutcome,
} from "@/lib/types/coffee";

export function pendingAdjustment(profile: BeanBrewProfile | undefined) {
  if (!profile?.pendingAdjustmentId) return undefined;
  return (profile.adjustmentHistory ?? []).find(
    (trial) => trial.id === profile.pendingAdjustmentId && !trial.outcome,
  );
}

export function saveAdjustmentOutcome(input: {
  profileId: string;
  adjustmentId: string;
  resultSessionId: string;
  outcome: BrewAdjustmentOutcome;
}) {
  const profile = beanBrewProfileStore.getById(input.profileId);
  if (!profile) throw new Error("조정 결과를 연결할 추출 프로필을 찾지 못했습니다.");
  const timestamp = new Date().toISOString();
  const nextProfile = withUpdatedTimestamp<BeanBrewProfile>({
    ...profile,
    adjustmentHistory: (profile.adjustmentHistory ?? []).map((trial) =>
      trial.id === input.adjustmentId
        ? {
            ...trial,
            resultSessionId: input.resultSessionId,
            outcome: input.outcome,
            evaluatedAt: timestamp,
          }
        : trial,
    ),
    pendingAdjustmentId:
      profile.pendingAdjustmentId === input.adjustmentId
        ? undefined
        : profile.pendingAdjustmentId,
  });
  if (!beanBrewProfileStore.upsert(nextProfile)) {
    throw new Error("조정 결과를 추출 프로필에 저장하지 못했습니다.");
  }
}
