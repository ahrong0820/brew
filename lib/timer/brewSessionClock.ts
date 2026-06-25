import type {
  RecommendationTimerStartDetail,
  TimerRecipe,
} from "./recommendationTimer";

export const activeBrewSessionStorageKey =
  "brew.activeRecommendationSession.v1";
export const brewSessionClockChangeEvent = "brew:session-clock-change";

export type BrewSessionClockStatus = "running" | "paused" | "completed";

export interface BrewSessionClock {
  version: 2;
  sessionId?: string;
  recipe?: TimerRecipe;
  recipeName: string;
  targetTimeSeconds: number;
  isFirstSession?: boolean;
  status: BrewSessionClockStatus;
  elapsedSeconds: number;
  runningSince: number | null;
  updatedAt: number;
}

interface LegacyActiveSession {
  sessionId?: unknown;
  recipeName?: unknown;
  startedAt?: unknown;
  targetTimeSeconds?: unknown;
}

interface StartBrewSessionClockInput {
  recipe: TimerRecipe;
  sessionId?: string;
  isFirstSession?: boolean;
}

function isClockStatus(value: unknown): value is BrewSessionClockStatus {
  return value === "running" || value === "paused" || value === "completed";
}

function isTimerRecipe(value: unknown): value is TimerRecipe {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<TimerRecipe>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.totalTime === "number" &&
    Number.isFinite(candidate.totalTime) &&
    Array.isArray(candidate.steps)
  );
}

function parseClock(value: unknown): BrewSessionClock | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<BrewSessionClock>;
  if (
    candidate.version !== 2 ||
    typeof candidate.recipeName !== "string" ||
    typeof candidate.targetTimeSeconds !== "number" ||
    !Number.isFinite(candidate.targetTimeSeconds) ||
    !isClockStatus(candidate.status) ||
    typeof candidate.elapsedSeconds !== "number" ||
    !Number.isFinite(candidate.elapsedSeconds) ||
    (candidate.runningSince !== null &&
      (typeof candidate.runningSince !== "number" ||
        !Number.isFinite(candidate.runningSince))) ||
    typeof candidate.updatedAt !== "number" ||
    !Number.isFinite(candidate.updatedAt)
  ) {
    return null;
  }

  if (candidate.sessionId !== undefined && typeof candidate.sessionId !== "string") {
    return null;
  }

  if (candidate.recipe !== undefined && !isTimerRecipe(candidate.recipe)) {
    return null;
  }

  return {
    version: 2,
    sessionId: candidate.sessionId,
    recipe: candidate.recipe,
    recipeName: candidate.recipeName,
    targetTimeSeconds: Math.max(0, candidate.targetTimeSeconds),
    isFirstSession: candidate.isFirstSession === true,
    status: candidate.status,
    elapsedSeconds: Math.max(0, candidate.elapsedSeconds),
    runningSince:
      candidate.status === "running" ? candidate.runningSince : null,
    updatedAt: candidate.updatedAt,
  };
}

function parseLegacyClock(value: unknown): BrewSessionClock | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as LegacyActiveSession;
  if (
    typeof candidate.sessionId !== "string" ||
    typeof candidate.recipeName !== "string" ||
    typeof candidate.startedAt !== "number" ||
    !Number.isFinite(candidate.startedAt) ||
    typeof candidate.targetTimeSeconds !== "number" ||
    !Number.isFinite(candidate.targetTimeSeconds)
  ) {
    return null;
  }

  return {
    version: 2,
    sessionId: candidate.sessionId,
    recipeName: candidate.recipeName,
    targetTimeSeconds: Math.max(0, candidate.targetTimeSeconds),
    status: "running",
    elapsedSeconds: 0,
    runningSince: candidate.startedAt,
    updatedAt: candidate.startedAt,
  };
}

function emitClockChange(clock: BrewSessionClock | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<BrewSessionClock | null>(brewSessionClockChangeEvent, {
      detail: clock,
    }),
  );
}

function persistClock(clock: BrewSessionClock | null) {
  if (typeof window === "undefined") {
    return clock;
  }

  try {
    if (clock) {
      window.sessionStorage.setItem(
        activeBrewSessionStorageKey,
        JSON.stringify(clock),
      );
    } else {
      window.sessionStorage.removeItem(activeBrewSessionStorageKey);
    }
  } catch {
    // 저장소를 사용할 수 없어도 현재 탭의 타이머 상태는 계속 동기화합니다.
  } finally {
    emitClockChange(clock);
  }

  return clock;
}

export function readBrewSessionClock(): BrewSessionClock | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(activeBrewSessionStorageKey);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    const clock = parseClock(parsed) ?? parseLegacyClock(parsed);

    if (!clock) {
      window.sessionStorage.removeItem(activeBrewSessionStorageKey);
    }

    return clock;
  } catch {
    window.sessionStorage.removeItem(activeBrewSessionStorageKey);
    return null;
  }
}

export function getBrewSessionElapsedSeconds(
  clock: BrewSessionClock | null,
  now = Date.now(),
) {
  if (!clock) {
    return 0;
  }

  if (clock.status !== "running" || clock.runningSince === null) {
    return Math.max(0, clock.elapsedSeconds);
  }

  return Math.max(
    0,
    clock.elapsedSeconds + Math.max(0, now - clock.runningSince) / 1000,
  );
}

export function startBrewSessionClock(
  input: StartBrewSessionClockInput,
  now = Date.now(),
) {
  const clock: BrewSessionClock = {
    version: 2,
    sessionId: input.sessionId,
    recipe: input.recipe,
    recipeName: input.recipe.name,
    targetTimeSeconds: input.recipe.totalTime,
    isFirstSession: input.isFirstSession,
    status: "running",
    elapsedSeconds: 0,
    runningSince: now,
    updatedAt: now,
  };

  return persistClock(clock);
}

export function startRecommendationBrewSessionClock(
  detail: RecommendationTimerStartDetail,
  now = Date.now(),
) {
  return startBrewSessionClock(
    {
      recipe: detail.recipe,
      sessionId: detail.sessionId,
      isFirstSession: detail.isFirstSession,
    },
    now,
  );
}

export function pauseBrewSessionClock(now = Date.now()) {
  const current = readBrewSessionClock();
  if (!current || current.status !== "running") {
    return current;
  }

  return persistClock({
    ...current,
    status: "paused",
    elapsedSeconds: getBrewSessionElapsedSeconds(current, now),
    runningSince: null,
    updatedAt: now,
  });
}

export function resumeBrewSessionClock(now = Date.now()) {
  const current = readBrewSessionClock();
  if (!current || current.status === "running" || current.status === "completed") {
    return current;
  }

  return persistClock({
    ...current,
    status: "running",
    runningSince: now,
    updatedAt: now,
  });
}

export function seekBrewSessionClock(
  elapsedSeconds: number,
  now = Date.now(),
) {
  const current = readBrewSessionClock();
  if (!current) {
    return null;
  }

  const nextElapsed = Number.isFinite(elapsedSeconds)
    ? Math.max(0, elapsedSeconds)
    : 0;

  return persistClock({
    ...current,
    elapsedSeconds: nextElapsed,
    runningSince: current.status === "running" ? now : null,
    updatedAt: now,
  });
}

export function resetBrewSessionClock(now = Date.now()) {
  const current = readBrewSessionClock();
  if (!current) {
    return null;
  }

  return persistClock({
    ...current,
    status: "paused",
    elapsedSeconds: 0,
    runningSince: null,
    updatedAt: now,
  });
}

export function completeBrewSessionClock(now = Date.now()) {
  const current = readBrewSessionClock();
  if (!current) {
    return null;
  }

  return persistClock({
    ...current,
    status: "completed",
    elapsedSeconds: getBrewSessionElapsedSeconds(current, now),
    runningSince: null,
    updatedAt: now,
  });
}

export function clearBrewSessionClock() {
  return persistClock(null);
}

export function subscribeToBrewSessionClock(
  listener: (clock: BrewSessionClock | null) => void,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = (event: Event) => {
    const detail = (event as CustomEvent<BrewSessionClock | null>).detail;
    listener(detail ?? readBrewSessionClock());
  };

  window.addEventListener(brewSessionClockChangeEvent, handleChange);
  return () => window.removeEventListener(brewSessionClockChangeEvent, handleChange);
}
