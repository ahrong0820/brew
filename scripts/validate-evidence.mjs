import { evidenceObservations } from "../data/evidence/observations.ts";
import { evidenceSources } from "../data/evidence/sources.ts";
import { checkObservationTextQuality } from "../lib/evidence/observationTextQuality.ts";
import { checkEvidenceSourceQuality } from "../lib/evidence/sourceQuality.ts";

const issues = [
  ...checkEvidenceSourceQuality(evidenceSources),
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
