import { evidenceWeightPolicy } from "@/data/recommendation/evidenceWeightPolicy";
import {
  evidenceLineages,
  evidenceRegistry,
} from "@/lib/evidence/registry";
import {
  getCandidateRule,
} from "@/lib/recommendation/candidateRuleRegistry";
import { calculateEvidenceScore } from "@/lib/recommendation/evidenceWeightCore";
import type { EvidenceContext } from "@/lib/types/evidence";
import type {
  CandidateEvidenceRole,
  CandidateRule,
} from "@/lib/types/candidateRule";
import type {
  EvidenceScoreBreakdown,
  WeightedEvidenceEntry,
} from "@/lib/types/evidenceWeight";

interface CandidateObservationEntry {
  observationId: string;
  role: CandidateEvidenceRole;
}

function candidateObservationEntries(
  rule: CandidateRule,
): readonly CandidateObservationEntry[] {
  return [
    ...rule.supportingObservationIds.map((observationId) => ({
      observationId,
      role: "supports" as const,
    })),
    ...rule.limitingObservationIds.map((observationId) => ({
      observationId,
      role: "limits" as const,
    })),
    ...rule.contradictingObservationIds.map((observationId) => ({
      observationId,
      role: "contradicts" as const,
    })),
  ];
}

export function getEvidenceIndependenceKey(sourceId: string) {
  const lineage = evidenceLineages.find((candidate) =>
    candidate.sourceIds.includes(sourceId),
  );
  return lineage?.familyId ?? sourceId;
}

export function scoreEvidenceObservation(
  observationId: string,
  targetContext: EvidenceContext,
  options?: {
    personalSuccessCount?: number;
    independenceMultiplier?: number;
  },
): EvidenceScoreBreakdown {
  const observation = evidenceRegistry.observations.find(
    (candidate) => candidate.id === observationId,
  );
  if (!observation) {
    throw new Error(`Unknown evidence observation: ${observationId}`);
  }

  const source = evidenceRegistry.sources.find(
    (candidate) => candidate.id === observation.sourceId,
  );
  if (!source) {
    throw new Error(`Unknown evidence source: ${observation.sourceId}`);
  }

  return calculateEvidenceScore(
    {
      source,
      observation,
      targetContext,
      personalSuccessCount: options?.personalSuccessCount,
      independenceMultiplier: options?.independenceMultiplier,
    },
    evidenceWeightPolicy,
  );
}

function aggregateIndependentEntries(
  entries: readonly WeightedEvidenceEntry[],
): readonly WeightedEvidenceEntry[] {
  const representativeByGroup = new Map<string, WeightedEvidenceEntry>();

  entries.forEach((entry) => {
    const groupKey = `${entry.role}:${entry.independenceKey}`;
    const current = representativeByGroup.get(groupKey);
    if (!current) {
      representativeByGroup.set(groupKey, entry);
      return;
    }

    if (entry.finalScore > current.finalScore) {
      representativeByGroup.set(groupKey, {
        ...entry,
        suppressedObservationIds: [
          ...entry.suppressedObservationIds,
          current.observationId,
          ...current.suppressedObservationIds,
        ],
      });
      return;
    }

    representativeByGroup.set(groupKey, {
      ...current,
      suppressedObservationIds: [
        ...current.suppressedObservationIds,
        entry.observationId,
        ...entry.suppressedObservationIds,
      ],
    });
  });

  return [...representativeByGroup.values()];
}

export function scoreCandidateRuleEvidence(
  candidateRuleId: string,
  targetContext: EvidenceContext,
  options?: {
    personalSuccessCounts?: Readonly<Record<string, number>>;
  },
) {
  const rule = getCandidateRule(candidateRuleId);
  if (!rule) {
    throw new Error(`Unknown candidate rule: ${candidateRuleId}`);
  }

  const rawEntries = candidateObservationEntries(rule).map(
    ({ observationId, role }): WeightedEvidenceEntry => {
      const score = scoreEvidenceObservation(observationId, targetContext, {
        personalSuccessCount: options?.personalSuccessCounts?.[observationId],
      });
      return {
        ...score,
        role,
        independenceKey: getEvidenceIndependenceKey(score.sourceId),
        suppressedObservationIds: [],
      };
    },
  );
  const entries = aggregateIndependentEntries(rawEntries);

  return {
    policyVersion: evidenceWeightPolicy.version,
    candidateRuleId,
    rawObservationCount: rawEntries.length,
    independentContributionCount: entries.length,
    entries,
  };
}
