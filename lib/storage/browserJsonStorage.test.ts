import assert from "node:assert/strict";
import test from "node:test";
import {
  removeStorageItem,
  writeJsonStorage,
} from "./browserJsonStorage.ts";

test("browser JSON storage reports quota and serialization failures", () => {
  const quotaStorage = {
    getItem: () => null,
    setItem: () => { throw new Error("quota"); },
    removeItem: () => undefined,
  };
  assert.equal(writeJsonStorage(quotaStorage, "key", { value: 1 }).ok, false);

  const circular: { self?: unknown } = {};
  circular.self = circular;
  assert.equal(writeJsonStorage(quotaStorage, "key", circular).ok, false);
});

test("browser JSON storage returns explicit mutation results", () => {
  const items = new Map<string, string>();
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
    removeItem: (key: string) => { items.delete(key); },
  };

  assert.equal(writeJsonStorage(storage, "key", { value: 1 }).ok, true);
  assert.equal(items.get("key"), '{"value":1}');
  assert.equal(removeStorageItem(storage, "key").ok, true);
  assert.equal(items.has("key"), false);
});
