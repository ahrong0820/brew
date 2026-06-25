import type { CoffeeStorageKey } from "@/lib/storage/keys";
import {
  readVersionedCollection,
  removeVersionedStorage,
  writeVersionedCollection,
} from "@/lib/storage/versionedStorage";

interface StoredEntity {
  id: string;
}

export interface CollectionStore<T extends StoredEntity> {
  list(): T[];
  getById(id: string): T | undefined;
  upsert(item: T): boolean;
  remove(id: string): boolean;
  replaceAll(items: T[]): boolean;
  clear(): boolean;
}

export function createCollectionStore<T extends StoredEntity>(
  key: CoffeeStorageKey,
  isItem: (value: unknown) => value is T,
): CollectionStore<T> {
  return {
    list() {
      return readVersionedCollection(key, isItem);
    },

    getById(id) {
      return readVersionedCollection(key, isItem).find((item) => item.id === id);
    },

    upsert(item) {
      const items = readVersionedCollection(key, isItem);
      const existingIndex = items.findIndex((stored) => stored.id === item.id);

      if (existingIndex >= 0) {
        items[existingIndex] = item;
      } else {
        items.push(item);
      }

      return writeVersionedCollection(key, items);
    },

    remove(id) {
      const items = readVersionedCollection(key, isItem);
      const nextItems = items.filter((item) => item.id !== id);

      if (nextItems.length === items.length) {
        return true;
      }

      return writeVersionedCollection(key, nextItems);
    },

    replaceAll(items) {
      return writeVersionedCollection(key, items);
    },

    clear() {
      return removeVersionedStorage(key);
    },
  };
}
