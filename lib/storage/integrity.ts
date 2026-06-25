import {
  brewProfileIdentityKey,
  normalizeDrinkStyle,
} from "@/lib/brew/profileIdentity";
import { createCollectionStore } from "@/lib/storage/collectionStore";
import { isCompatibleBrewSession } from "@/lib/storage/brewSessionGuard";
import {
  isBean,
  isBeanBrewProfile,
} from "@/lib/storage/guards";
import { storageKeys } from "@/lib/storage/keys";
import type {
  Bean,
  BeanBrewProfile,
  BrewSession,
} from "@/lib/types/coffee";

const activeRecommendationSessionStorageKey =
  "brew.activeRecommendationSession.v1";

const beans = createCollectionStore<Bean>(storageKeys.beans, isBean);
const profiles = createCollectionStore<BeanBrewProfile>(
  storageKeys.beanBrewProfiles,
  isBeanBrewProfile,
);
const sessions = createCollectionStore<BrewSession>(
  storageKeys.brewSessions,
  isCompatibleBrewSession,
);

export interface CoffeeIntegrityReport {
  changed: boolean;
  removedOrphanProfiles: number;
  mergedDuplicateProfiles: number;
  removedOrphanSessions: number;
  repairedSessionLinks: number;
  repairedProfileLinks: number;
  clearedInvalidActiveSession: boolean;
}

function profileKey(profile: BeanBrewProfile) {
  return brewProfileIdentityKey(profile);
}

function sameCollection<T>(left: T[], right: T[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function dedupeById<T extends { id: string; updatedAt: string }>(items: T[]) {
  const byId = new Map<string, T>();

  for (const item of items) {
    const stored = byId.get(item.id);
    if (!stored || item.updatedAt > stored.updatedAt) {
      byId.set(item.id, item);
    }
  }

  return [...byId.values()];
}

function repairActiveSessionMarker(validSessions: BrewSession[]) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.sessionStorage.getItem(
      activeRecommendationSessionStorageKey,
    );
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as { sessionId?: unknown };
    const session =
      typeof parsed.sessionId === "string"
        ? validSessions.find((item) => item.id === parsed.sessionId)
        : undefined;

    if (!session || session.actualTimeSeconds !== undefined) {
      window.sessionStorage.removeItem(activeRecommendationSessionStorageKey);
      return true;
    }
  } catch {
    window.sessionStorage.removeItem(activeRecommendationSessionStorageKey);
    return true;
  }

  return false;
}

export function repairCoffeeStorageIntegrity(): CoffeeIntegrityReport {
  const storedBeans = dedupeById(beans.list());
  const beanIds = new Set(storedBeans.map((bean) => bean.id));
  const storedProfiles = dedupeById(profiles.list());
  const normalizedProfiles = storedProfiles.map((profile) => ({
    ...profile,
    drinkStyle: normalizeDrinkStyle(profile.drinkStyle),
  }));
  const validProfiles = normalizedProfiles.filter((profile) =>
    beanIds.has(profile.beanId),
  );
  const removedOrphanProfiles =
    storedProfiles.length - validProfiles.length;

  const canonicalByKey = new Map<string, BeanBrewProfile>();
  const profileIdRemap = new Map<string, string>();

  for (const profile of [...validProfiles].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )) {
    const key = profileKey(profile);
    const canonical = canonicalByKey.get(key);

    if (canonical) {
      profileIdRemap.set(profile.id, canonical.id);
    } else {
      canonicalByKey.set(key, profile);
      profileIdRemap.set(profile.id, profile.id);
    }
  }

  const canonicalProfiles = [...canonicalByKey.values()];
  const canonicalProfileById = new Map(
    canonicalProfiles.map((profile) => [profile.id, profile]),
  );
  const mergedDuplicateProfiles =
    validProfiles.length - canonicalProfiles.length;

  let removedOrphanSessions = 0;
  let repairedSessionLinks = 0;
  const storedSessions = dedupeById(sessions.list());
  const normalizedSessions: BrewSession[] = [];

  for (const session of storedSessions) {
    const canonicalProfileId = profileIdRemap.get(session.profileId);
    const canonicalProfile = canonicalProfileId
      ? canonicalProfileById.get(canonicalProfileId)
      : undefined;

    if (!canonicalProfile || !beanIds.has(canonicalProfile.beanId)) {
      removedOrphanSessions += 1;
      continue;
    }

    const drinkStyle = normalizeDrinkStyle(canonicalProfile.drinkStyle);
    const needsRepair =
      session.profileId !== canonicalProfile.id ||
      session.beanId !== canonicalProfile.beanId ||
      session.drinkStyle !== drinkStyle ||
      session.recipeSnapshot.drinkStyle !== drinkStyle;

    normalizedSessions.push(
      needsRepair
        ? {
            ...session,
            profileId: canonicalProfile.id,
            beanId: canonicalProfile.beanId,
            drinkStyle,
            recipeSnapshot: {
              ...session.recipeSnapshot,
              drinkStyle,
            },
          }
        : session,
    );

    if (needsRepair) {
      repairedSessionLinks += 1;
    }
  }

  const sessionsByProfile = new Map<string, BrewSession[]>();
  for (const session of normalizedSessions) {
    const list = sessionsByProfile.get(session.profileId) ?? [];
    list.push(session);
    sessionsByProfile.set(session.profileId, list);
  }

  let repairedProfileLinks = 0;
  const repairedSessions: BrewSession[] = [];
  const repairedProfiles = canonicalProfiles.map((profile) => {
    const profileSessions = [...(sessionsByProfile.get(profile.id) ?? [])].sort(
      (left, right) => right.createdAt.localeCompare(left.createdAt),
    );
    const latest = profileSessions[0];
    const explicitBest = profileSessions.find(
      (session) => session.id === profile.currentBestSessionId,
    );
    const currentBest =
      explicitBest ??
      profileSessions.find((session) => session.status === "current-best") ??
      profileSessions.find(
        (session) =>
          session.status === "good" || session.tastingResult === "good",
      );

    for (const session of profileSessions) {
      if (currentBest && session.id === currentBest.id) {
        repairedSessions.push(
          session.status === "current-best"
            ? session
            : { ...session, status: "current-best", tastingResult: "good" },
        );
      } else if (session.status === "current-best") {
        repairedSessions.push({ ...session, status: "good" });
      } else {
        repairedSessions.push(session);
      }
    }

    const nextCurrentBestId = currentBest?.id;
    const nextLatestId = latest?.id;
    const needsRepair =
      profile.currentBestSessionId !== nextCurrentBestId ||
      profile.latestSessionId !== nextLatestId;

    if (needsRepair) {
      repairedProfileLinks += 1;
    }

    return needsRepair
      ? {
          ...profile,
          currentBestSessionId: nextCurrentBestId,
          latestSessionId: nextLatestId,
        }
      : profile;
  });

  const profileChanged = !sameCollection(storedProfiles, repairedProfiles);
  const sessionChanged = !sameCollection(storedSessions, repairedSessions);

  if (profileChanged) {
    profiles.replaceAll(repairedProfiles);
  }
  if (sessionChanged) {
    sessions.replaceAll(repairedSessions);
  }

  const clearedInvalidActiveSession = repairActiveSessionMarker(
    repairedSessions,
  );

  return {
    changed:
      profileChanged || sessionChanged || clearedInvalidActiveSession,
    removedOrphanProfiles,
    mergedDuplicateProfiles,
    removedOrphanSessions,
    repairedSessionLinks,
    repairedProfileLinks,
    clearedInvalidActiveSession,
  };
}
