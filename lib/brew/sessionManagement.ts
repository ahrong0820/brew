import {
  clearedCurrentBestSessionId,
  isCurrentBestExplicitlyCleared,
  listExplicitlyClearedProfileIds,
  markCurrentBestExplicitlyCleared,
  removeCurrentBestExplicitlyCleared,
} from "@/lib/brew/currentBestState";
import { withUpdatedTimestamp } from "@/lib/domain/factories";
import { detachCustomRecipesFromSession } from "@/lib/customRecipes/sourceLinks";
import {
  beanBrewProfileStore,
  brewSessionStore,
} from "@/lib/storage/coffeeData";
import type {
  BeanBrewProfile,
  BrewSession,
  BrewSessionStatus,
  TastingResult,
} from "@/lib/types/coffee";

export interface UpdateBrewSessionInput {
  sessionId: string;
  actualTimeSeconds: number | null;
  tastingResult: TastingResult | null;
  note: string;
}

type BestSelection =
  | { mode: "preserve" }
  | { mode: "select"; sessionId: string }
  | { mode: "clear" };

function isSuccessful(session: BrewSession) {
  return (
    session.tastingResult === "good" ||
    session.status === "good" ||
    session.status === "current-best"
  );
}

function normalizeActualTime(value: number | null) {
  if (value === null) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    throw new Error("실제 추출 시간이 올바르지 않습니다.");
  }

  return Math.max(1, Math.round(value));
}

function chooseBestSessionId(
  profile: BeanBrewProfile,
  profileSessions: BrewSession[],
  selection: BestSelection,
) {
  if (selection.mode === "clear") {
    return clearedCurrentBestSessionId;
  }

  if (selection.mode === "select") {
    const selected = profileSessions.find(
      (session) => session.id === selection.sessionId,
    );

    if (!selected) {
      throw new Error("현재 베스트로 지정할 추출 기록을 찾지 못했습니다.");
    }

    if (selected.tastingResult !== "good") {
      throw new Error("좋음으로 평가된 추출만 현재 베스트로 지정할 수 있습니다.");
    }

    return selected.id;
  }

  if (isCurrentBestExplicitlyCleared(profile.currentBestSessionId)) {
    return clearedCurrentBestSessionId;
  }

  const explicit = profileSessions.find(
    (session) =>
      session.id === profile.currentBestSessionId && isSuccessful(session),
  );
  if (explicit) {
    return explicit.id;
  }

  const statusBest = profileSessions.find(
    (session) => session.status === "current-best" && isSuccessful(session),
  );
  if (statusBest) {
    return statusBest.id;
  }

  return profileSessions.find(isSuccessful)?.id;
}

function normalizedStatus(
  session: BrewSession,
  bestSessionId: string | undefined,
): BrewSessionStatus {
  if (session.id === bestSessionId) {
    return "current-best";
  }

  if (session.tastingResult === "good") {
    return "good";
  }

  if (session.status === "archived") {
    return "archived";
  }

  return "trial";
}

function saveProfileSessions(
  profile: BeanBrewProfile,
  nextProfileSessions: BrewSession[],
  selection: BestSelection,
) {
  const previousSessions = brewSessionStore.list();
  const previousProfile = profile;
  const timestamp = new Date().toISOString();
  const sortedProfileSessions = [...nextProfileSessions].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const selectedBestId = chooseBestSessionId(
    profile,
    sortedProfileSessions,
    selection,
  );
  const actualBestId = isCurrentBestExplicitlyCleared(selectedBestId)
    ? undefined
    : selectedBestId;
  const normalizedProfileSessions = sortedProfileSessions.map((session) => {
    const nextStatus = normalizedStatus(session, actualBestId);
    const nextTastingResult =
      nextStatus === "current-best" ? "good" : session.tastingResult;
    const changed =
      nextStatus !== session.status ||
      nextTastingResult !== session.tastingResult;

    return changed
      ? withUpdatedTimestamp<BrewSession>(
          {
            ...session,
            tastingResult: nextTastingResult,
            status: nextStatus,
          },
          timestamp,
        )
      : session;
  });
  const otherSessions = previousSessions.filter(
    (session) => session.profileId !== profile.id,
  );
  const nextSessions = [...otherSessions, ...normalizedProfileSessions];
  const nextProfile = withUpdatedTimestamp<BeanBrewProfile>(
    {
      ...profile,
      currentBestSessionId: selectedBestId,
      latestSessionId: sortedProfileSessions[0]?.id,
    },
    timestamp,
  );

  if (!brewSessionStore.replaceAll(nextSessions)) {
    throw new Error("추출 기록을 저장하지 못했습니다.");
  }

  if (!beanBrewProfileStore.upsert(nextProfile)) {
    brewSessionStore.replaceAll(previousSessions);
    beanBrewProfileStore.upsert(previousProfile);
    throw new Error("추출 프로필 연결 정보를 저장하지 못했습니다.");
  }

  return {
    profile: nextProfile,
    sessions: normalizedProfileSessions,
  };
}

export function updateBrewSessionRecord(
  input: UpdateBrewSessionInput,
): BrewSession {
  const session = brewSessionStore.getById(input.sessionId);
  if (!session) {
    throw new Error("수정할 추출 기록을 찾지 못했습니다.");
  }

  const profile = beanBrewProfileStore.getById(session.profileId);
  if (!profile) {
    throw new Error("연결된 추출 프로필을 찾지 못했습니다.");
  }

  const nextTastingResult = input.tastingResult ?? undefined;
  const nextSession = withUpdatedTimestamp<BrewSession>({
    ...session,
    actualTimeSeconds: normalizeActualTime(input.actualTimeSeconds),
    tastingResult: nextTastingResult,
    note: input.note.trim() || undefined,
    status:
      nextTastingResult === "good"
        ? session.status === "current-best"
          ? "current-best"
          : "good"
        : "trial",
  });
  const profileSessions = brewSessionStore
    .list()
    .filter((item) => item.profileId === profile.id)
    .map((item) => (item.id === nextSession.id ? nextSession : item));
  const result = saveProfileSessions(profile, profileSessions, {
    mode: "preserve",
  });

  return (
    result.sessions.find((item) => item.id === nextSession.id) ?? nextSession
  );
}

export function setCurrentBestSession(sessionId: string) {
  const session = brewSessionStore.getById(sessionId);
  if (!session) {
    throw new Error("현재 베스트로 지정할 추출 기록을 찾지 못했습니다.");
  }

  const profile = beanBrewProfileStore.getById(session.profileId);
  if (!profile) {
    throw new Error("연결된 추출 프로필을 찾지 못했습니다.");
  }

  const wasExplicitlyCleared = listExplicitlyClearedProfileIds().includes(
    profile.id,
  );
  if (
    wasExplicitlyCleared &&
    !removeCurrentBestExplicitlyCleared(profile.id)
  ) {
    throw new Error("현재 베스트 해제 상태를 갱신하지 못했습니다.");
  }

  try {
    const profileSessions = brewSessionStore
      .list()
      .filter((item) => item.profileId === profile.id);

    return saveProfileSessions(profile, profileSessions, {
      mode: "select",
      sessionId,
    });
  } catch (error) {
    if (wasExplicitlyCleared) {
      markCurrentBestExplicitlyCleared(profile.id);
    }
    throw error;
  }
}

export function clearCurrentBestSession(profileId: string) {
  const profile = beanBrewProfileStore.getById(profileId);
  if (!profile) {
    throw new Error("현재 베스트를 해제할 추출 프로필을 찾지 못했습니다.");
  }

  if (!markCurrentBestExplicitlyCleared(profile.id)) {
    throw new Error("현재 베스트 해제 상태를 저장하지 못했습니다.");
  }

  try {
    const profileSessions = brewSessionStore
      .list()
      .filter((item) => item.profileId === profile.id);

    return saveProfileSessions(profile, profileSessions, { mode: "clear" });
  } catch (error) {
    removeCurrentBestExplicitlyCleared(profile.id);
    throw error;
  }
}

export function deleteBrewSessionRecord(sessionId: string) {
  const session = brewSessionStore.getById(sessionId);
  if (!session) {
    throw new Error("삭제할 추출 기록을 찾지 못했습니다.");
  }

  const profile = beanBrewProfileStore.getById(session.profileId);
  if (!profile) {
    throw new Error("연결된 추출 프로필을 찾지 못했습니다.");
  }

  const remainingSessions = brewSessionStore
    .list()
    .filter(
      (item) => item.profileId === profile.id && item.id !== session.id,
    );
  const wasCurrentBest =
    profile.currentBestSessionId === session.id ||
    session.status === "current-best";
  const nextProfile = wasCurrentBest
    ? {
        ...profile,
        currentBestSessionId: undefined,
      }
    : profile;

  saveProfileSessions(nextProfile, remainingSessions, { mode: "preserve" });
  const linkedRecipesDetached = detachCustomRecipesFromSession(session.id);

  if (typeof window !== "undefined") {
    try {
      const key = "brew.activeRecommendationSession.v1";
      const raw = window.sessionStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as { sessionId?: unknown }) : null;
      if (parsed?.sessionId === session.id) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      window.sessionStorage.removeItem("brew.activeRecommendationSession.v1");
    }
  }

  return { linkedRecipesDetached };
}
