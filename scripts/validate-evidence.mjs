import { advisorSourcesJamesHoffmann } from "../data/evidence/advisorSourcesJamesHoffmann.ts";
import { advisorSourcesTetsuKasuya } from "../data/evidence/advisorSourcesTetsuKasuya.ts";
import { expertVideoProvenance } from "../data/evidence/expertVideoProvenance.ts";
import { evidenceObservations } from "../data/evidence/observations.ts";
import { originVarietyObservations1 } from "../data/evidence/originVarietyObservations1.ts";
import { originVarietySources1 } from "../data/evidence/originVarietySources1.ts";
import { roastObservations1 } from "../data/evidence/roastObservations1.ts";
import { roastSources1 } from "../data/evidence/roastSources1.ts";
import { evidenceSources } from "../data/evidence/sources.ts";
import { checkExpertVideoProvenance } from "../lib/evidence/expertVideoQuality.ts";
import { checkObservationTextQuality } from "../lib/evidence/observationTextQuality.ts";
import { checkEvidenceSourceQuality } from "../lib/evidence/sourceQuality.ts";

const sources = [
  ...evidenceSources,
  ...advisorSourcesJamesHoffmann,
  ...advisorSourcesTetsuKasuya,
  ...originVarietySources1,
  ...roastSources1,
];
const observations = [
  ...evidenceObservations,
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
