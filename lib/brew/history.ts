import {
  isCurrentBestExplicitlyCleared,
  listExplicitlyClearedProfileIds,
  markCurrentBestExplicitlyCleared,
  removeCurrentBestExplicitlyCleared,
} from "@/lib/brew/currentBestState";
import { withUpdatedTimestamp } from "@/lib/domain/factories";
import {
  beanBrewProfileStore,
  beanStore,
  brewSessionStore,
  grinderProfileStore,
} from "@/lib/storage/coffeeData";
import type {
  Bean,
  BeanBrewProfile,
  BrewSession,
  GrinderProfile,
  RecommendationConfidence,
} from "@/lib/types/coffee";

export interface BrewProfileHistorySummary {
  profile: BeanBrewProfile;
  bean: Bean;
  grinder: GrinderProfile | undefined;
  sessions: BrewSession[];
  successfulSessions: BrewSession[];
  currentBest: BrewSession | undefined;
  historyConfidence: RecommendationConfidence;
}

function isSuccessfulSession(session: BrewSession) {
  return session.status === "good" || session.status === "current-best" || session.tastingResult === "good";
}

export function historyConfidenceForSuccessCount(successCount: number): RecommendationConfidence {
  if (successCount >= 2) return "high";
  if (successCount === 1) return "medium";
  return "reference";
}

export function promoteCurrentBestSession(session: BrewSession): BrewSession {
  const profile = beanBrewProfileStore.getById(session.profileId);
  if (!profile) throw new Error("현재 베스트를 연결할 추출 프로필을 찾지 못했습니다.");

  const wasExplicitlyCleared = listExplicitlyClearedProfileIds().includes(profile.id);
  if (wasExplicitlyCleared && !removeCurrentBestExplicitlyCleared(profile.id)) {
    throw new Error("현재 베스트 해제 상태를 갱신하지 못했습니다.");
  }

  const timestamp = new Date().toISOString();
  const previousSessions = brewSessionStore.list();
  const promotedSession = withUpdatedTimestamp<BrewSession>({
    ...session,
    tastingResult: "good",
    status: "current-best",
  }, timestamp);

  try {
    const nextSessions = previousSessions.map((stored) => {
      if (stored.id === promotedSession.id) return promotedSession;
      if (stored.profileId === promotedSession.profileId && stored.status === "current-best") {
        return withUpdatedTimestamp<BrewSession>({ ...stored, status: "good" }, timestamp);
      }
      return stored;
    });

    if (!nextSessions.some((stored) => stored.id === promotedSession.id)) nextSessions.push(promotedSession);
    if (!brewSessionStore.replaceAll(nextSessions)) throw new Error("현재 베스트 추출 기록을 저장하지 못했습니다.");

    const nextProfile = withUpdatedTimestamp<BeanBrewProfile>({
      ...profile,
      currentBestSessionId: promotedSession.id,
      latestSessionId: promotedSession.id,
    }, timestamp);

    if (!beanBrewProfileStore.upsert(nextProfile)) {
      brewSessionStore.replaceAll(previousSessions);
      throw new Error("현재 베스트 연결 정보를 저장하지 못했습니다.");
    }

    return promotedSession;
  } catch (error) {
    if (wasExplicitlyCleared) {
      markCurrentBestExplicitlyCleared(profile.id);
    }
    throw error;
  }
}

export function listBrewProfileHistorySummaries(): BrewProfileHistorySummary[] {
  const beansById = new Map(beanStore.list().map((bean) => [bean.id, bean]));
  const grindersById = new Map(grinderProfileStore.list().map((grinder) => [grinder.id, grinder]));
  const sessions = brewSessionStore.list();
  const summaries: BrewProfileHistorySummary[] = [];

  for (const profile of beanBrewProfileStore.list()) {
    const bean = beansById.get(profile.beanId);
    if (!bean) continue;

    const profileSessions = sessions
      .filter((session) => session.profileId === profile.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const successfulSessions = profileSessions.filter(isSuccessfulSession);
    const currentBest = isCurrentBestExplicitlyCleared(
      profile.currentBestSessionId,
    )
      ? undefined
      : profileSessions.find(
            (session) => session.id === profile.currentBestSessionId,
          ) ??
        profileSessions.find((session) => session.status === "current-best") ??
        successfulSessions[0];

    summaries.push({
      profile,
      bean,
      grinder: grindersById.get(profile.grinderProfileId),
      sessions: profileSessions,
      successfulSessions,
      currentBest,
      historyConfidence: historyConfidenceForSuccessCount(successfulSessions.length),
    });
  }

  return summaries.sort((left, right) => right.profile.updatedAt.localeCompare(left.profile.updatedAt));
}
