import { expertVideoProvenance } from "../data/evidence/expertVideoProvenance.ts";
import { evidenceObservations } from "../data/evidence/observations.ts";
import { evidenceSources } from "../data/evidence/sources.ts";
import { checkExpertVideoProvenance } from "../lib/evidence/expertVideoQuality.ts";
import { checkObservationTextQuality } from "../lib/evidence/observationTextQuality.ts";
import { checkEvidenceSourceQuality } from "../lib/evidence/sourceQuality.ts";

const issues = [
  ...checkEvidenceSourceQuality(evidenceSources),
  ...checkExpertVideoProvenance(evidenceSources, expertVideoProvenance),
  ...checkObservationTextQuality(evidenceObservations),
];

for (const issue of issues) {
  console.log(`${issue.level.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
}

const errors = issues.filter((issue) => issue.level === "error");
if (errors.length > 0) {
  throw new Error(`Evidence validation failed with ${errors.length} error(s).`);
}

console.log(
  `Evidence validation passed: ${evidenceSources.length} sources, ${evidenceObservations.length} observations.`,
);
