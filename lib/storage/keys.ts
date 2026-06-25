export const STORAGE_SCHEMA_VERSION = 1 as const;

export const storageKeys = {
  beans: "brew.beans.v1",
  grinderProfiles: "brew.grinderProfiles.v1",
  beanBrewProfiles: "brew.beanBrewProfiles.v1",
  brewSessions: "brew.brewSessions.v1",
  userPreferences: "brew.userPreferences.v1",
} as const;

export type CoffeeStorageKey = (typeof storageKeys)[keyof typeof storageKeys];
