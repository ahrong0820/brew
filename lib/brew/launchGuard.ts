import { brewSessionStore } from "@/lib/storage/coffeeData";

const activeSessionStorageKey = "brew.activeRecommendationSession.v1";
const recentLaunchStorageKey = "brew.recentRecommendationLaunch.v1";
const duplicateWindowMilliseconds = 5000;

type StoredActiveSession = {
  sessionId?: unknown;
};

type StoredRecentLaunch = {
  fingerprint?: unknown;
  sessionId?: unknown;
  createdAt?: unknown;
};

function readSessionStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function isUnfinishedSession(sessionId: unknown) {
  if (typeof sessionId !== "string") {
    return false;
  }

  const session = brewSessionStore.getById(sessionId);
  return Boolean(session && session.actualTimeSeconds === undefined);
}

export function assertRecommendationLaunchAllowed(fingerprint: string) {
  if (typeof window === "undefined") {
    return;
  }

  const active = readSessionStorage<StoredActiveSession>(
    activeSessionStorageKey,
  );
  if (active && isUnfinishedSession(active.sessionId)) {
    throw new Error(
      "진행 중인 추출이 있습니다. 먼저 화면 하단의 ‘추출 완료’를 눌러 주세요.",
    );
  }

  const recent = readSessionStorage<StoredRecentLaunch>(
    recentLaunchStorageKey,
  );
  if (
    recent &&
    recent.fingerprint === fingerprint &&
    typeof recent.createdAt === "number" &&
    Date.now() - recent.createdAt < duplicateWindowMilliseconds &&
    isUnfinishedSession(recent.sessionId)
  ) {
    throw new Error("같은 추천 타이머가 이미 시작되었습니다.");
  }
}

export function markRecommendationLaunch(
  fingerprint: string,
  sessionId: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      recentLaunchStorageKey,
      JSON.stringify({ fingerprint, sessionId, createdAt: Date.now() }),
    );
  } catch {
    // 세션 저장소를 사용할 수 없어도 추출 기록 자체는 유지합니다.
  }
}
