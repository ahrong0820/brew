import { removeCurrentBestExplicitlyCleared } from "@/lib/brew/currentBestState";
import { withUpdatedTimestamp } from "@/lib/domain/factories";
import {
  beanBrewProfileStore,
  brewSessionStore,
} from "@/lib/storage/coffeeData";
import type {
  BeanBrewProfile,
  BrewSession,
  PersonalRecipeVersion,
} from "@/lib/types/coffee";

export interface RestoredPersonalRecipeVersion {
  profile: BeanBrewProfile;
  session: BrewSession;
  version: PersonalRecipeVersion;
}

export function restorePersonalRecipeVersion(
  profileId: string,
  versionNumber: number,
): RestoredPersonalRecipeVersion {
  const profile = beanBrewProfileStore.getById(profileId);
  const personalRecipe = profile?.personalRecipe;
  if (!profile || !personalRecipe) {
    throw new Error("복원할 개인 레시피를 찾지 못했습니다.");
  }

  const version = personalRecipe.versions.find(
    (candidate) => candidate.version === versionNumber,
  );
  if (!version) {
    throw new Error("선택한 개인 레시피 버전을 찾지 못했습니다.");
  }

  const previousSessions = brewSessionStore.list();
  const targetSession = previousSessions.find(
    (session) =>
      session.id === version.sessionId && session.profileId === profile.id,
  );
  if (!targetSession) {
    throw new Error("선택한 버전의 추출 기록을 찾지 못했습니다.");
  }

  const timestamp = new Date().toISOString();
  const restoredSession = withUpdatedTimestamp<BrewSession>(
    {
      ...targetSession,
      tastingResult: "good",
      status: "current-best",
    },
    timestamp,
  );
  const nextSessions = previousSessions.map((session) => {
    if (session.id === restoredSession.id) return restoredSession;
    if (session.profileId === profile.id && session.status === "current-best") {
      return withUpdatedTimestamp<BrewSession>(
        { ...session, status: "good" },
        timestamp,
      );
    }
    return session;
  });
  const nextProfile = withUpdatedTimestamp<BeanBrewProfile>(
    {
      ...profile,
      currentBestSessionId: restoredSession.id,
      personalRecipe: {
        ...personalRecipe,
        currentSessionId: restoredSession.id,
        version: version.version,
        updatedAt: timestamp,
      },
    },
    timestamp,
  );

  if (!brewSessionStore.replaceAll(nextSessions)) {
    throw new Error("개인 레시피 버전의 추출 기록을 복원하지 못했습니다.");
  }
  if (!beanBrewProfileStore.upsert(nextProfile)) {
    brewSessionStore.replaceAll(previousSessions);
    throw new Error("개인 레시피 버전 상태를 복원하지 못했습니다.");
  }

  removeCurrentBestExplicitlyCleared(profile.id);
  return { profile: nextProfile, session: restoredSession, version };
}
