export const clearedCurrentBestSessionId = "__brew_current_best_cleared__";

const clearedProfilesStorageKey = "brew.currentBestClears.v1";

export function isCurrentBestExplicitlyCleared(
  sessionId: string | undefined,
) {
  return sessionId === clearedCurrentBestSessionId;
}

export function listExplicitlyClearedProfileIds() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(clearedProfilesStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeProfileIds(profileIds: string[]) {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    window.localStorage.setItem(
      clearedProfilesStorageKey,
      JSON.stringify([...new Set(profileIds)]),
    );
    return true;
  } catch {
    return false;
  }
}

export function markCurrentBestExplicitlyCleared(profileId: string) {
  return writeProfileIds([...listExplicitlyClearedProfileIds(), profileId]);
}

export function removeCurrentBestExplicitlyCleared(profileId: string) {
  return writeProfileIds(
    listExplicitlyClearedProfileIds().filter((id) => id !== profileId),
  );
}
