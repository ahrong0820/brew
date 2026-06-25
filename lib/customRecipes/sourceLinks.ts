const customRecipesStorageKey = "coffee-custom-recipes";

interface LinkedRecipeRecord {
  id?: unknown;
  sourceCurrentBestProfileId?: unknown;
  sourceCurrentBestSessionId?: unknown;
  [key: string]: unknown;
}

function readItems(): unknown[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(customRecipesStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is LinkedRecipeRecord {
  return typeof value === "object" && value !== null;
}

export function getLinkedCustomRecipeCount(sessionId: string) {
  return readItems().filter(
    (item) =>
      isRecord(item) && item.sourceCurrentBestSessionId === sessionId,
  ).length;
}

export function detachCustomRecipesFromSession(sessionId: string) {
  if (typeof window === "undefined") {
    return true;
  }

  const items = readItems();
  let changed = false;
  const nextItems = items.map((item) => {
    if (!isRecord(item) || item.sourceCurrentBestSessionId !== sessionId) {
      return item;
    }

    changed = true;
    const { sourceCurrentBestSessionId: _removed, ...rest } = item;
    return rest;
  });

  if (!changed) {
    return true;
  }

  try {
    window.localStorage.setItem(
      customRecipesStorageKey,
      JSON.stringify(nextItems),
    );
    return true;
  } catch {
    return false;
  }
}
