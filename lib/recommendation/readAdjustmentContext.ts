import type { BrewAdjustmentSuggestion } from "@/lib/recommendation/adjustment";
import {
  fixedConditionLabels,
  personalizationStageForSuccessCount,
  type AdjustmentPresentationContext,
} from "@/lib/recommendation/adjustmentContext";
import {
  brewPaceAssessmentLabel,
  personalizationStageLabel,
  personalizationStageMessage,
  tastingResultLabel,
} from "@/lib/recommendation/adjustmentLabels";
import {
  beanBrewProfileStore,
  brewSessionStore,
} from "@/lib/storage/coffeeData";

export function readAdjustmentContext(
  suggestion: BrewAdjustmentSuggestion,
): AdjustmentPresentationContext | null {
  const session = brewSessionStore.getById(suggestion.sessionId);
  if (!session) return null;

  const profile = beanBrewProfileStore.getById(session.profileId);
  const sessions = brewSessionStore
    .list()
    .filter((candidate) => candidate.profileId === session.profileId);
  const successfulCount = sessions.filter(
    (candidate) =>
      candidate.status === "good" ||
      candidate.status === "current-best" ||
      candidate.tastingResult === "good",
  ).length;
  const stage = personalizationStageForSuccessCount(successfulCount);

  return {
    sourceRecipeId: profile?.sourceRecipeId,
    recipeName: session.recipeSnapshot.sourceTemplateName,
    actualTimeSeconds: session.actualTimeSeconds,
    brewPaceAssessment: session.brewPaceAssessment,
    brewPaceLabel: brewPaceAssessmentLabel(session.brewPaceAssessment),
    tastingResult: session.tastingResult,
    tastingLabel: tastingResultLabel(session.tastingResult),
    personalizationStage: stage,
    personalizationStageLabel: personalizationStageLabel(stage),
    personalizationMessage: personalizationStageMessage(stage, successfulCount),
    successfulSessionCount: successfulCount,
    totalSessionCount: sessions.length,
    fixedConditions: fixedConditionLabels(
      suggestion.variable,
      session.recipeSnapshot,
    ),
  };
}
