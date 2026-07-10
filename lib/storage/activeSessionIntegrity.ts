export interface StoredSessionLink {
  id: string;
  actualTimeSeconds?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function shouldClearActiveSessionMarker(
  parsed: unknown,
  validSessions: readonly StoredSessionLink[],
) {
  if (!isRecord(parsed)) {
    return true;
  }

  if (parsed.sessionId === undefined) {
    // 기본 레시피 타이머는 추천 추출 기록과 연결되지 않아 sessionId가 없습니다.
    return false;
  }

  if (typeof parsed.sessionId !== "string") {
    return true;
  }

  const session = validSessions.find((item) => item.id === parsed.sessionId);
  return !session || session.actualTimeSeconds !== undefined;
}
