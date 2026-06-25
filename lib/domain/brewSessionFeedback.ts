import { withUpdatedTimestamp } from "@/lib/domain/factories";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import type { BrewSession, TastingResult } from "@/lib/types/coffee";

export interface BrewFeedbackInput {
  actualTimeSeconds: number;
  tastingResult?: TastingResult;
  note?: string;
}

function normalizeActualTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return 1;
  }

  return Math.max(1, Math.min(60 * 30, Math.round(seconds)));
}

export function recordBrewActualTime(
  sessionId: string,
  actualTimeSeconds: number,
): BrewSession | null {
  const session = brewSessionStore.getById(sessionId);

  if (!session) {
    return null;
  }

  const updated = withUpdatedTimestamp({
    ...session,
    actualTimeSeconds: normalizeActualTime(actualTimeSeconds),
  });

  return brewSessionStore.upsert(updated) ? updated : null;
}

export function saveBrewFeedback(
  sessionId: string,
  input: BrewFeedbackInput,
): BrewSession | null {
  const session = brewSessionStore.getById(sessionId);

  if (!session) {
    return null;
  }

  const trimmedNote = input.note?.trim();
  const updated = withUpdatedTimestamp({
    ...session,
    actualTimeSeconds: normalizeActualTime(input.actualTimeSeconds),
    tastingResult: input.tastingResult,
    note: trimmedNote || session.note,
    status: input.tastingResult === "good" ? ("good" as const) : ("trial" as const),
  });

  return brewSessionStore.upsert(updated) ? updated : null;
}
