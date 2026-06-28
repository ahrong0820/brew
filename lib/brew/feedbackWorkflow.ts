export type FeedbackEventKind = "brew-feedback" | "adjustment-outcome";

export function feedbackEventKind(input: {
  hasTastingResult: boolean;
  hasAdjustmentOutcome: boolean;
}): FeedbackEventKind | null {
  if (input.hasAdjustmentOutcome) return "adjustment-outcome";
  if (input.hasTastingResult) return "brew-feedback";
  return null;
}

export function shouldSyncRecipe(kind: FeedbackEventKind) {
  return kind === "brew-feedback";
}

export function shouldPromptForOutcome(input: {
  kind: FeedbackEventKind;
  hasAppliedAdjustment: boolean;
  hasAdjustmentOutcome: boolean;
}) {
  return (
    input.kind === "brew-feedback" &&
    input.hasAppliedAdjustment &&
    !input.hasAdjustmentOutcome
  );
}
