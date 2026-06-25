import { promoteCurrentBestSession } from "@/lib/brew/history";
import { withUpdatedTimestamp } from "@/lib/domain/factories";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import type {
  BrewSession,
  BrewSessionStatus,
  TastingResult,
} from "@/lib/types/coffee";

export const brewFeedbackSavedEvent = "brew:feedback-saved";

export interface BrewFeedbackSavedDetail {
  sessionId: string;
}

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
  const nextTastingResult = input.tastingResult ?? session.tastingResult;
  const nextStatus: BrewSessionStatus =
    input.tastingResult === undefined
      ? session.status
      : nextTastingResult === "good"
        ? session.status === "current-best"
          ? "current-best"
          : "good"
        : "trial";
  const nextSession: BrewSession = withUpdatedTimestamp<BrewSession>({
    ...session,
    actualTimeSeconds: actualTimeSeconds ?? session.actualTimeSeconds,
    tastingResult: nextTastingResult,
    note: trimmedNote ? trimmedNote : session.note,
    status: nextStatus,
  });
  const savedSession =
    input.tastingResult === "good"
      ? promoteCurrentBestSession(nextSession)
      : nextSession;

  if (
    input.tastingResult !== "good" &&
    !brewSessionStore.upsert(savedSession)
  ) {
    throw new Error("추출 기록을 저장하지 못했습니다.");
  }

  if (input.tastingResult && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<BrewFeedbackSavedDetail>(brewFeedbackSavedEvent, {
        detail: { sessionId: savedSession.id },
      }),
    );
  }

  return savedSession;
}
