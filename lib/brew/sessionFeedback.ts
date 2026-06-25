import { withUpdatedTimestamp } from "@/lib/domain/factories";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import type { BrewSession, TastingResult } from "@/lib/types/coffee";

export interface BrewFeedbackInput {
  sessionId: string;
  actualTimeSeconds?: number;
  tastingResult?: TastingResult;
  note?: string;
}

function normalizeActualTime(value: number | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    throw new Error("실제 추출 시간이 올바르지 않습니다.");
  }

  return Math.max(1, Math.round(value));
}

export function saveBrewFeedback(input: BrewFeedbackInput): BrewSession {
  const session = brewSessionStore.getById(input.sessionId);

  if (!session) {
    throw new Error("저장할 추출 기록을 찾지 못했습니다.");
  }

  const actualTimeSeconds = normalizeActualTime(input.actualTimeSeconds);
  const trimmedNote = input.note?.trim();
  const nextSession = withUpdatedTimestamp({
    ...session,
    actualTimeSeconds: actualTimeSeconds ?? session.actualTimeSeconds,
    tastingResult: input.tastingResult ?? session.tastingResult,
    note: trimmedNote ? trimmedNote : session.note,
    status:
      (input.tastingResult ?? session.tastingResult) === "good"
        ? "good"
        : session.status === "good"
          ? "good"
          : "trial",
  });

  if (!brewSessionStore.upsert(nextSession)) {
    throw new Error("추출 기록을 저장하지 못했습니다.");
  }

  return nextSession;
}
