import {
  STORAGE_SCHEMA_VERSION,
  type CoffeeStorageKey,
} from "@/lib/storage/keys";

export interface VersionedCollection<T> {
  version: typeof STORAGE_SCHEMA_VERSION;
  updatedAt: string;
  items: T[];
}

export interface VersionedValue<T> {
  version: typeof STORAGE_SCHEMA_VERSION;
  updatedAt: string;
  value: T;
}

type ItemGuard<T> = (value: unknown) => value is T;
type ValueGuard<T> = (value: unknown) => value is T;

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStoredJson(key: CoffeeStorageKey): unknown {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function readVersionedCollection<T>(
  key: CoffeeStorageKey,
  isItem: ItemGuard<T>,
): T[] {
  const parsed = parseStoredJson(key);

  if (
    !isRecord(parsed) ||
    parsed.version !== STORAGE_SCHEMA_VERSION ||
    !Array.isArray(parsed.items)
  ) {
    return [];
  }

  return parsed.items.filter(isItem);
}

export function writeVersionedCollection<T>(
  key: CoffeeStorageKey,
  items: T[],
): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  const payload: VersionedCollection<T> = {
    version: STORAGE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    items,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function readVersionedValue<T>(
  key: CoffeeStorageKey,
  isValue: ValueGuard<T>,
  fallback: T,
): T {
  const parsed = parseStoredJson(key);

  if (
    !isRecord(parsed) ||
    parsed.version !== STORAGE_SCHEMA_VERSION ||
    !isValue(parsed.value)
  ) {
    return fallback;
  }

  return parsed.value;
}

export function writeVersionedValue<T>(
  key: CoffeeStorageKey,
  value: T,
): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  const payload: VersionedValue<T> = {
    version: STORAGE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    value,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function removeVersionedStorage(key: CoffeeStorageKey): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
