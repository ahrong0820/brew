import { feedbackEventKind } from "@/lib/brew/feedbackWorkflow";
import { promoteCurrentBestSession } from "@/lib/brew/history";
import { withUpdatedTimestamp } from "@/lib/domain/factories";
import {
  beanBrewProfileStore,
  brewSessionStore,
} from "@/lib/storage/coffeeData";
import type {
  BeanBrewProfile,
  BrewAdjustmentOutcome,
  BrewPaceAssessment,
  BrewSession,
  BrewSessionStatus,
  TastingResult,
} from "@/lib/types/coffee";

export const brewFeedbackSavedEvent = "brew:feedback-saved";

export interface BrewFeedbackSavedDetail {
  sessionId: string;
}

export interface BrewFeedbackInput {
  sessionId: string;
  actualTimeSeconds?: number;
  brewPaceAssessment?: BrewPaceAssessment;
  tastingResult?: TastingResult;
  adjustmentOutcome?: BrewAdjustmentOutcome;
  note?: string;
}

function normalizeActualTime(value: number | undefined) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) {
    throw new Error("실제 추출 시간이 올바르지 않습니다.");
  }
  return Math.max(1, Math.round(value));
}

function pendingTrial(profile: BeanBrewProfile | undefined) {
  if (!profile?.pendingAdjustmentId) return undefined;
  return (profile.adjustmentHistory ?? []).find(
    (trial) => trial.id === profile.pendingAdjustmentId && !trial.outcome,
  );
}

function finalizeAdjustmentTrial(
  profileId: string,
  adjustmentId: string,
  resultSessionId: string,
  outcome: BrewAdjustmentOutcome,
) {
  const profile = beanBrewProfileStore.getById(profileId);
  if (!profile) {
    throw new Error("조정 결과를 연결할 추출 프로필을 찾지 못했습니다.");
  }

  const timestamp = new Date().toISOString();
  const history = (profile.adjustmentHistory ?? []).map((trial) =>
    trial.id === adjustmentId
      ? {
          ...trial,
          resultSessionId,
          outcome,
          evaluatedAt: timestamp,
        }
      : trial,
  );
  const nextProfile = withUpdatedTimestamp<BeanBrewProfile>(
    {
      ...profile,
      adjustmentHistory: history,
      pendingAdjustmentId:
        profile.pendingAdjustmentId === adjustmentId
          ? undefined
          : profile.pendingAdjustmentId,
    },
    timestamp,
  );

  if (!beanBrewProfileStore.upsert(nextProfile)) {
    throw new Error("조정 결과를 추출 프로필에 저장하지 못했습니다.");
  }
}

function diagnosticFeedbackChanged(
  session: BrewSession,
  input: BrewFeedbackInput,
  trimmedNote: string | undefined,
) {
  if (input.tastingResult === undefined) return false;
  return (
    input.tastingResult !== session.tastingResult ||
    (input.brewPaceAssessment !== undefined &&
      input.brewPaceAssessment !== session.brewPaceAssessment) ||
    (input.note !== undefined && trimmedNote !== session.note)
  );
}

export function saveBrewFeedback(input: BrewFeedbackInput): BrewSession {
  const session = brewSessionStore.getById(input.sessionId);
  if (!session) {
    throw new Error("저장할 추출 기록을 찾지 못했습니다.");
  }

  const profile = beanBrewProfileStore.getById(session.profileId);
  const adjustment = pendingTrial(profile);
  const actualTimeSeconds = normalizeActualTime(input.actualTimeSeconds);
  const trimmedNote = input.note?.trim();
  const hasDiagnosticChange = diagnosticFeedbackChanged(
    session,
    input,
    trimmedNote,
  );
  const hasOutcomeChange =
    input.adjustmentOutcome !== undefined &&
    input.adjustmentOutcome !== session.adjustmentOutcome;
  const nextTastingResult = input.tastingResult ?? session.tastingResult;
  const nextStatus: BrewSessionStatus =
    input.tastingResult === undefined
      ? session.status
      : nextTastingResult === "good"
        ? session.status === "current-best"
          ? "current-best"
          : "good"
        : "trial";
  const nextSession: BrewSession = withUpdatedTimestamp<BrewSession>({
    ...session,
    actualTimeSeconds: actualTimeSeconds ?? session.actualTimeSeconds,
    brewPaceAssessment:
      input.brewPaceAssessment ?? session.brewPaceAssessment,
    tastingResult: nextTastingResult,
    appliedAdjustmentId: adjustment?.id ?? session.appliedAdjustmentId,
    comparedToSessionId:
      adjustment?.sourceSessionId ?? session.comparedToSessionId,
    adjustmentOutcome: input.adjustmentOutcome ?? session.adjustmentOutcome,
    note: trimmedNote ? trimmedNote : session.note,
    status: nextStatus,
  });
  const savedSession =
    input.tastingResult === "good" && hasDiagnosticChange
      ? promoteCurrentBestSession(nextSession)
      : nextSession;

  if (
    !(input.tastingResult === "good" && hasDiagnosticChange) &&
    !brewSessionStore.upsert(savedSession)
  ) {
    throw new Error("추출 기록을 저장하지 못했습니다.");
  }

  if (adjustment && input.adjustmentOutcome && hasOutcomeChange) {
    finalizeAdjustmentTrial(
      session.profileId,
      adjustment.id,
      savedSession.id,
      input.adjustmentOutcome,
    );
  }

  const eventKind = feedbackEventKind({
    hasTastingResult: hasDiagnosticChange,
    hasAdjustmentOutcome: hasOutcomeChange,
  });
  if (eventKind && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<BrewFeedbackSavedDetail>(brewFeedbackSavedEvent, {
        detail: { sessionId: savedSession.id },
      }),
    );
  }

  return savedSession;
}
