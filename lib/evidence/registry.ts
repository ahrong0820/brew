import { eventBatch1Sources } from "@/data/evidence/eventBatch1";
import { eventBatch1Observations } from "@/data/evidence/eventBatch1Observations";
import { evidenceObservations } from "@/data/evidence/observations";
import { researchBatch1Sources } from "@/data/evidence/researchBatch1";
import { researchBatch1B } from "@/data/evidence/researchBatch1B";
import { researchBatch1Observations } from "@/data/evidence/researchBatch1Observations";
import { evidenceSources } from "@/data/evidence/sources";
import { assertValidEvidenceRegistry } from "@/lib/evidence/validation";
import type {
  EvidenceObservation,
  EvidenceRegistry,
  EvidenceSource,
} from "@/lib/types/evidence";

export const evidenceRegistryVersion = "1.2.0";

export const evidenceRegistry: EvidenceRegistry = {
  version: evidenceRegistryVersion,
  sources: [
    ...evidenceSources,
    ...researchBatch1Sources,
    ...eventBatch1Sources,
  ],
  observations: [
    ...evidenceObservations,
    ...researchBatch1Observations,
    ...researchBatch1B,
    ...eventBatch1Observations,
  ],
};

assertValidEvidenceRegistry(evidenceRegistry);

const sourceById = new Map<string, EvidenceSource>(
  evidenceRegistry.sources.map((source) => [source.id, source]),
);
const observationById = new Map<string, EvidenceObservation>(
  evidenceRegistry.observations.map((observation) => [
    observation.id,
    observation,
  ]),
);

export function getEvidenceSource(sourceId: string) {
  return sourceById.get(sourceId);
}

export function getEvidenceObservation(observationId: string) {
  return observationById.get(observationId);
}

export function listEvidenceObservationsForSource(sourceId: string) {
  return evidenceRegistry.observations.filter(
    (observation) => observation.sourceId === sourceId,
  );
}

export function resolveEvidenceObservation(observationId: string) {
  const observation = getEvidenceObservation(observationId);
  if (!observation) {
    return undefined;
  }

  const source = getEvidenceSource(observation.sourceId);
  if (!source) {
    return undefined;
  }

  return { source, observation };
}
