import {
  createDefaultGrinderProfiles,
  createDefaultUserPreferences,
} from "@/data/defaultCoffeeProfiles";
import { isCompatibleBrewSession } from "@/lib/storage/brewSessionGuard";
import { createCollectionStore } from "@/lib/storage/collectionStore";
import {
  isBean,
  isBeanBrewProfile,
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
  isCompatibleBrewSession,
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
  const defaults = createDefaultGrinderProfiles();
  const defaultIds = new Set(defaults.map((profile) => profile.id));
  const storedById = new Map(storedProfiles.map((profile) => [profile.id, profile]));

  const refreshedDefaults = defaults.map((profile) => {
    const stored = storedById.get(profile.id);

    if (!stored) {
      return profile;
    }

    return {
      ...stored,
      ...profile,
      personalOffset: stored.personalOffset,
      createdAt: stored.createdAt,
    };
  });
  const customProfiles = storedProfiles.filter(
    (profile) => !defaultIds.has(profile.id),
  );

  return grinderProfileStore.replaceAll([
    ...refreshedDefaults,
    ...customProfiles,
  ]);
}

export function initializeCoffeeStorage(): boolean {
  const grinderProfilesReady = ensureDefaultGrinderProfiles();
  const storedPreferences = getUserPreferences();
  const preferencesReady = saveUserPreferences(storedPreferences);

  return grinderProfilesReady && preferencesReady;
}
