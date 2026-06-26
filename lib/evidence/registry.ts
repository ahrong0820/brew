import { advisorLineageScottRao } from "@/data/evidence/advisorLineageScottRao";
import { advisorNotesA } from "@/data/evidence/advisorNotesA";
import { advisorNotesScottRao } from "@/data/evidence/advisorNotesScottRao";
import { advisorSourceA } from "@/data/evidence/advisorSourceA";
import { advisorSourcesJamesHoffmann } from "@/data/evidence/advisorSourcesJamesHoffmann";
import { advisorSourcesScottRao } from "@/data/evidence/advisorSourcesScottRao";
import { equipmentData1Sources } from "@/data/evidence/equipmentData1";
import { equipmentNotes1 } from "@/data/evidence/equipmentNotes1";
import { equipmentNotes2 } from "@/data/evidence/equipmentNotes2";
import { eventBatch1Sources } from "@/data/evidence/eventBatch1";
import { eventBatch1Observations } from "@/data/evidence/eventBatch1Observations";
import { evidenceObservations } from "@/data/evidence/observations";
import { originVarietyObservations1 } from "@/data/evidence/originVarietyObservations1";
import { originVarietySources1 } from "@/data/evidence/originVarietySources1";
import { researchBatch1Sources } from "@/data/evidence/researchBatch1";
import { researchBatch1B } from "@/data/evidence/researchBatch1B";
import { researchBatch1Observations } from "@/data/evidence/researchBatch1Observations";
import { researchGrindStatic1Sources } from "@/data/evidence/researchGrindStatic1";
import { researchGrindStatic1Observations } from "@/data/evidence/researchGrindStatic1Observations";
import { researchPressureFlow1Sources } from "@/data/evidence/researchPressureFlow1";
import { researchPressureFlow1Observations } from "@/data/evidence/researchPressureFlow1Observations";
import { researchUnevenExtraction1Sources } from "@/data/evidence/researchUnevenExtraction1";
import { researchUnevenExtraction1Observations } from "@/data/evidence/researchUnevenExtraction1Observations";
import { evidenceSources } from "@/data/evidence/sources";
import { assertValidEvidenceRegistry } from "@/lib/evidence/validation";
import type {
  EvidenceObservation,
  EvidenceRegistry,
  EvidenceSource,
} from "@/lib/types/evidence";

export const evidenceRegistryVersion = "1.11.0";

export const evidenceRegistry: EvidenceRegistry = {
  version: evidenceRegistryVersion,
  sources: [
    ...evidenceSources,
    ...researchBatch1Sources,
    ...researchGrindStatic1Sources,
    ...researchUnevenExtraction1Sources,
    ...researchPressureFlow1Sources,
    ...eventBatch1Sources,
    ...equipmentData1Sources,
    ...advisorSourceA,
    ...advisorSourcesJamesHoffmann,
    ...advisorSourcesScottRao,
    ...originVarietySources1,
  ],
  observations: [
    ...evidenceObservations,
    ...researchBatch1Observations,
    ...researchBatch1B,
    ...researchGrindStatic1Observations,
    ...researchUnevenExtraction1Observations,
    ...researchPressureFlow1Observations,
    ...eventBatch1Observations,
    ...equipmentNotes1,
    ...equipmentNotes2,
    ...advisorNotesA,
    ...advisorNotesScottRao,
    ...originVarietyObservations1,
  ],
};

export const evidenceLineages = [...advisorLineageScottRao] as const;

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
