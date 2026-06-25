import {
  createDefaultGrinderProfiles,
  createDefaultUserPreferences,
} from "@/data/defaultCoffeeProfiles";
import { createCollectionStore } from "@/lib/storage/collectionStore";
import {
  isBean,
  isBeanBrewProfile,
  isBrewSession,
  isGrinderProfile,
  isUserPreferences,
} from "@/lib/storage/guards";
import { storageKeys } from "@/lib/storage/keys";
import {
  readVersionedValue,
  writeVersionedValue,
} from "@/lib/storage/versionedStorage";
import type {
  Bean,
  BeanBrewProfile,
  BrewSession,
  GrinderProfile,
  UserPreferences,
} from "@/lib/types/coffee";

export const beanStore = createCollectionStore<Bean>(
  storageKeys.beans,
  isBean,
);

export const grinderProfileStore = createCollectionStore<GrinderProfile>(
  storageKeys.grinderProfiles,
  isGrinderProfile,
);

export const beanBrewProfileStore = createCollectionStore<BeanBrewProfile>(
  storageKeys.beanBrewProfiles,
  isBeanBrewProfile,
);

export const brewSessionStore = createCollectionStore<BrewSession>(
  storageKeys.brewSessions,
  isBrewSession,
);

export function getUserPreferences(): UserPreferences {
  const fallback = createDefaultUserPreferences();

  return readVersionedValue(
    storageKeys.userPreferences,
    isUserPreferences,
    fallback,
  );
}

export function saveUserPreferences(preferences: UserPreferences): boolean {
  return writeVersionedValue(storageKeys.userPreferences, preferences);
}

export function ensureDefaultGrinderProfiles(): boolean {
  const storedProfiles = grinderProfileStore.list();
  const storedIds = new Set(storedProfiles.map((profile) => profile.id));
  const missingDefaults = createDefaultGrinderProfiles().filter(
    (profile) => !storedIds.has(profile.id),
  );

  if (missingDefaults.length === 0) {
    return true;
  }

  return grinderProfileStore.replaceAll([...storedProfiles, ...missingDefaults]);
}

export function initializeCoffeeStorage(): boolean {
  const grinderProfilesReady = ensureDefaultGrinderProfiles();
  const storedPreferences = getUserPreferences();
  const preferencesReady = saveUserPreferences(storedPreferences);

  return grinderProfilesReady && preferencesReady;
}
