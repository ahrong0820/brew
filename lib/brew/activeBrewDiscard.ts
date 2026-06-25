import { deleteBrewSessionRecord } from "@/lib/brew/sessionManagement";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import { readBrewSessionClock } from "@/lib/timer/brewSessionClock";

export const brewSessionDiscardedEvent = "brew:session-discarded";

export interface BrewSessionDiscardedDetail {
  sessionId: string;
  linkedRecipesDetached: boolean;
}

export function discardActiveBrewSession(sessionId: string) {
  const clock = readBrewSessionClock();
  if (
    !clock ||
    clock.sessionId !== sessionId ||
    clock.status === "completed"
  ) {
    throw new Error("폐기할 진행 중 추출을 찾지 못했습니다.");
  }

  const session = brewSessionStore.getById(sessionId);
  if (!session || session.actualTimeSeconds !== undefined) {
    throw new Error("이미 완료되었거나 삭제된 추출 기록입니다.");
  }

  const result = deleteBrewSessionRecord(sessionId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<BrewSessionDiscardedDetail>(brewSessionDiscardedEvent, {
        detail: {
          sessionId,
          linkedRecipesDetached: result.linkedRecipesDetached,
        },
      }),
    );
  }

  return result;
}
