import { calculateOriginMatch } from "#origin-region-matching";
import type { EvidenceContext, NumericRange } from "@/lib/types/evidence";
import type {
  ConditionMatchDimension,
  ConditionMatchResult,
  ConditionMatchState,
  EvidenceScoreBreakdown,
  EvidenceScoreRequest,
  EvidenceWeightPolicy,
} from "@/lib/types/evidenceWeight";

function arrayMatch<T>(
  evidenceValues: readonly T[] | undefined,
  targetValues: readonly T[] | undefined,
): ConditionMatchState {
  if (!targetValues?.length) {
    return "not-applicable";
  }
  if (!evidenceValues?.length) {
    return "unknown";
  }

  const overlap = targetValues.filter((value) => evidenceValues.includes(value));
  if (overlap.length === 0) {
    return "mismatch";
  }
  return overlap.length === targetValues.length ? "match" : "partial";
}

function rangeMatch(
  evidenceRange: NumericRange | undefined,
  targetRange: NumericRange | undefined,
): ConditionMatchState {
  if (!targetRange) {
    return "not-applicable";
  }
  if (!evidenceRange || evidenceRange.unit !== targetRange.unit) {
    return "unknown";
  }

  const evidenceMin = evidenceRange.min ?? Number.NEGATIVE_INFINITY;
  const evidenceMax = evidenceRange.max ?? Number.POSITIVE_INFINITY;
  const targetMin = targetRange.min ?? Number.NEGATIVE_INFINITY;
  const targetMax = targetRange.max ?? Number.POSITIVE_INFINITY;

  if (evidenceMax < targetMin || targetMax < evidenceMin) {
    return "mismatch";
  }
  if (evidenceMin <= targetMin && evidenceMax >= targetMax) {
    return "match";
  }
  return "partial";
}

function combineStates(
  states: readonly ConditionMatchState[],
): ConditionMatchState {
  const applicable = states.filter((state) => state !== "not-applicable");
  if (applicable.length === 0) {
    return "not-applicable";
  }
  if (applicable.every((state) => state === "match")) {
    return "match";
  }
  if (applicable.every((state) => state === "unknown")) {
    return "unknown";
  }
  if (applicable.every((state) => state === "mismatch")) {
    return "mismatch";
  }
  return "partial";
}

function conditionDimensions(
  evidence: EvidenceContext,
  target: EvidenceContext,
): Readonly<Record<ConditionMatchDimension, ConditionMatchState>> {
  return {
    brewer: arrayMatch(
      evidence.brew?.brewerTypes,
      target.brew?.brewerTypes,
    ),
    drinkStyle: arrayMatch(
      evidence.brew?.drinkStyles,
      target.brew?.drinkStyles,
    ),
    origin: calculateOriginMatch(evidence.bean, target.bean),
    roastLevel: arrayMatch(
      evidence.bean?.roastLevels,
      target.bean?.roastLevels,
    ),
    process: arrayMatch(evidence.bean?.processes, target.bean?.processes),
    doseRatio: combineStates([
      rangeMatch(evidence.brew?.doseGrams, target.brew?.doseGrams),
      rangeMatch(evidence.brew?.ratio, target.brew?.ratio),
    ]),
    grinderBurr: combineStates([
      arrayMatch(evidence.grinder?.models, target.grinder?.models),
      arrayMatch(evidence.grinder?.burrTypes, target.grinder?.burrTypes),
    ]),
    filter: arrayMatch(
      evidence.brew?.filterMaterials,
      target.brew?.filterMaterials,
    ),
    water: combineStates([
      rangeMatch(evidence.water?.tdsPpm, target.water?.tdsPpm),
      rangeMatch(
        evidence.water?.hardnessPpmAsCaCO3,
        target.water?.hardnessPpmAsCaCO3,
      ),
      rangeMatch(
        evidence.water?.alkalinityPpmAsCaCO3,
        target.water?.alkalinityPpmAsCaCO3,
      ),
      rangeMatch(evidence.water?.ph, target.water?.ph),
    ]),
    tasteGoal: arrayMatch(
      evidence.brew?.tasteGoals,
      target.brew?.tasteGoals,
    ),
  };
}

export function calculateConditionMatch(
  evidence: EvidenceContext,
  target: EvidenceContext,
  policy: EvidenceWeightPolicy,
): ConditionMatchResult {
  const dimensions = conditionDimensions(evidence, target);
  const score = Object.entries(dimensions).reduce(
    (total, [dimension, state]) =>
      total +
      policy.conditionDimensionWeights[
        dimension as ConditionMatchDimension
      ] * policy.conditionStateWeights[state],
    0,
  );

  return {
    score: Math.max(0, Math.min(1, score)),
    dimensions,
  };
}

function reviewTrustWeight(
  request: EvidenceScoreRequest,
  policy: EvidenceWeightPolicy,
) {
  const metadataComplete = Boolean(
    request.observation.assessment.reviewedBy?.trim() &&
      request.observation.assessment.reviewedAt?.trim(),
  );

  return (
    policy.reviewStatusWeights[request.observation.reviewStatus] *
    policy.extractionConfidenceWeights[
      request.observation.assessment.extractionConfidence
    ] *
    (metadataComplete
      ? policy.reviewMetadataWeight.complete
      : policy.reviewMetadataWeight.incomplete)
  );
}

export function calculateEvidenceScore(
  request: EvidenceScoreRequest,
  policy: EvidenceWeightPolicy,
): EvidenceScoreBreakdown {
  const sourceTypeWeight = policy.sourceTypeWeights[request.source.type];
  const methodologyWeight =
    policy.methodologyWeights[
      request.observation.assessment.methodologicalStrength
    ];
  const directnessWeight =
    policy.directnessWeights[request.observation.assessment.directness];
  const conditionMatch = calculateConditionMatch(
    request.observation.context,
    request.targetContext,
    policy,
  );
  const independenceWeight =
    request.independenceMultiplier ?? policy.independence.independent;
  const reproducibilityWeight =
    policy.reproducibilityWeights[
      request.observation.assessment.reproducibility
    ];
  const reviewTrust = reviewTrustWeight(request, policy);
  const personalSuccessWeight =
    request.source.type === "personal"
      ? request.personalSuccessCount !== undefined &&
        request.personalSuccessCount >= 2
        ? policy.personalSuccessWeight.repeated
        : policy.personalSuccessWeight.single
      : 1;

  const finalScore = [
    sourceTypeWeight,
    methodologyWeight,
    directnessWeight,
    conditionMatch.score,
    independenceWeight,
    reproducibilityWeight,
    reviewTrust,
    personalSuccessWeight,
  ].reduce((product, value) => product * value, 1);

  return {
    sourceId: request.source.id,
    observationId: request.observation.id,
    sourceTypeWeight,
    methodologyWeight,
    directnessWeight,
    conditionMatch,
    independenceWeight,
    reproducibilityWeight,
    reviewTrustWeight: reviewTrust,
    personalSuccessWeight,
    finalScore: Math.max(0, Math.min(1, finalScore)),
  };
}
