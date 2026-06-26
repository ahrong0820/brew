import type { BrewSession } from "@/lib/types/coffee";

export interface PersonalEvidenceSummary {
  matchingSessions: BrewSession[];
  successfulSessions: BrewSession[];
  totalCount: number;
  successfulCount: number;
  hasRepeatedSuccess: boolean;
  latestSession?: BrewSession;
  currentBestSession?: BrewSession;
}

export function isSuccessfulPersonalSession(session: BrewSession) {
  return (
    session.status === "good" ||
    session.status === "current-best" ||
    session.tastingResult === "good"
  );
}

export function summarizePersonalSessions(
  sessions: readonly BrewSession[],
): PersonalEvidenceSummary {
  const matchingSessions = [...sessions].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const successfulSessions = matchingSessions.filter(
    isSuccessfulPersonalSession,
  );
  const currentBestSession =
    matchingSessions.find((session) => session.status === "current-best") ??
    successfulSessions[0];

  return {
    matchingSessions,
    successfulSessions,
    totalCount: matchingSessions.length,
    successfulCount: successfulSessions.length,
    hasRepeatedSuccess: successfulSessions.length >= 2,
    latestSession: matchingSessions[0],
    currentBestSession,
  };
}
