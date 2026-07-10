export interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorageMutationResult {
  ok: boolean;
  error?: Error;
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

export function writeJsonStorage(
  storage: BrowserStorageLike,
  key: string,
  value: unknown,
): StorageMutationResult {
  try {
    storage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export function removeStorageItem(
  storage: BrowserStorageLike,
  key: string,
): StorageMutationResult {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
