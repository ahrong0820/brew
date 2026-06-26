import assert from "node:assert/strict";
import test from "node:test";

import { evidenceObservations } from "../data/evidence/observations.ts";
import { evidenceSources } from "../data/evidence/sources.ts";
import { checkObservationTextQuality } from "../lib/evidence/observationTextQuality.ts";
import { checkEvidenceSourceQuality } from "../lib/evidence/sourceQuality.ts";

function hasLocation(observation) {
  const value = observation.excerpt.locator;
  return Boolean(
    value.page !== undefined ||
      value.section ||
      value.figure ||
      value.table ||
      value.paragraph ||
      value.timestampStartSeconds !== undefined,
  );
}

test("registered observation text is ready for review", () => {
  assert.deepEqual(checkObservationTextQuality(evidenceObservations), []);
});

test("missing external source URLs remain visible as warnings", () => {
  const issues = checkEvidenceSourceQuality(evidenceSources);
  assert.ok(issues.every((issue) => issue.level === "warning"));
});

test("published, video and competition observations include locations", () => {
  const sourceById = new Map(
    evidenceSources.map((source) => [source.id, source]),
  );

  for (const observation of evidenceObservations) {
    const source = sourceById.get(observation.sourceId);
    if (
      source?.type === "paper" ||
      source?.type === "competition" ||
      (source?.type === "expert" && source.medium === "video")
    ) {
      assert.equal(hasLocation(observation), true, observation.id);
    }
    if (source?.type === "competition") {
      assert.notEqual(observation.kind, "controlled-comparison");
    }
  }
});
