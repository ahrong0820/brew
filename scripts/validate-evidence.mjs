import { advisorSourceA } from "../data/evidence/advisorSourceA.ts";
import { advisorSourcesJamesHoffmann } from "../data/evidence/advisorSourcesJamesHoffmann.ts";
import { advisorSourcesTetsuKasuya } from "../data/evidence/advisorSourcesTetsuKasuya.ts";
import { equipmentData1Sources } from "../data/evidence/equipmentData1.ts";
import { equipmentNotes1 } from "../data/evidence/equipmentNotes1.ts";
import { equipmentNotes2 } from "../data/evidence/equipmentNotes2.ts";
import { equipmentNotes3 } from "../data/evidence/equipmentNotes3.ts";
import { expertVideoProvenance } from "../data/evidence/expertVideoProvenance.ts";
import { evidenceObservations } from "../data/evidence/observations.ts";
import { manufacturerSourcesHarioV60 } from "../data/evidence/manufacturerSourcesHarioV60.ts";
import { originVarietyObservations1 } from "../data/evidence/originVarietyObservations1.ts";
import { originVarietySources1 } from "../data/evidence/originVarietySources1.ts";
import { researchBatch1Observations } from "../data/evidence/researchBatch1Observations.ts";
import { roastObservations1 } from "../data/evidence/roastObservations1.ts";
import { roastSources1 } from "../data/evidence/roastSources1.ts";
import { evidenceSources } from "../data/evidence/sources.ts";
import { standardsBrewing1Sources } from "../data/evidence/standardsBrewing1.ts";
import { standardsBrewing1Observations } from "../data/evidence/standardsBrewing1Observations.ts";
import { v60FoundationObservations1 } from "../data/evidence/v60FoundationObservations1.ts";
import { checkExpertVideoProvenance } from "../lib/evidence/expertVideoQuality.ts";
import { checkObservationTextQuality } from "../lib/evidence/observationTextQuality.ts";
import { checkEvidenceSourceQuality } from "../lib/evidence/sourceQuality.ts";

const sources = [
  ...evidenceSources,
  ...equipmentData1Sources,
  ...manufacturerSourcesHarioV60,
  ...standardsBrewing1Sources,
  ...advisorSourceA,
  ...advisorSourcesJamesHoffmann,
  ...advisorSourcesTetsuKasuya,
  ...originVarietySources1,
  ...roastSources1,
];
const observations = [
  ...evidenceObservations,
  ...researchBatch1Observations,
  ...equipmentNotes1,
  ...equipmentNotes2,
  ...equipmentNotes3,
  ...v60FoundationObservations1,
  ...standardsBrewing1Observations,
  ...originVarietyObservations1,
  ...roastObservations1,
];
const issues = [
  ...checkEvidenceSourceQuality(sources),
  ...checkExpertVideoProvenance(sources, expertVideoProvenance),
  ...checkObservationTextQuality(observations),
];

for (const issue of issues) {
  console.log(`${issue.level.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
}

const errors = issues.filter((issue) => issue.level === "error");
if (errors.length > 0) {
  throw new Error(`Evidence validation failed with ${errors.length} error(s).`);
}

console.log(
  `Evidence validation passed: ${sources.length} sources, ${observations.length} observations.`,
);
