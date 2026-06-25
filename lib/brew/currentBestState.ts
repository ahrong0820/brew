export const clearedCurrentBestSessionId = "__brew_current_best_cleared__";

export function isCurrentBestExplicitlyCleared(
  sessionId: string | undefined,
) {
  return sessionId === clearedCurrentBestSessionId;
}
