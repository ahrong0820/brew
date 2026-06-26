import assert from "node:assert/strict";
import test from "node:test";

import { evidenceObservations } from "../data/evidence/observations.ts";
import { evidenceSources } from "../data/evidence/sources.ts";
import { validateEvidenceRegistry } from "../lib/evidence/validation.ts";

const validRegistry = {
  version: "1.0.0",
  sources: evidenceSources,
  observations: evidenceObservations,
};

test("built-in evidence registry has valid references and ranges", () => {
  assert.deepEqual(validateEvidenceRegistry(validRegistry), []);
});

test("duplicate source and observation ids are rejected", () => {
  const issues = validateEvidenceRegistry({
    ...validRegistry,
    sources: [...evidenceSources, evidenceSources[0]],
    observations: [...evidenceObservations, evidenceObservations[0]],
  });

  assert.ok(issues.some((issue) => issue.code === "duplicate-source-id"));
  assert.ok(issues.some((issue) => issue.code === "duplicate-observation-id"));
});

test("an observation cannot reference a missing source", () => {
  const brokenObservation = {
    ...evidenceObservations[0],
    id: "obs:test:missing-source",
    sourceId: "source:does-not-exist",
  };
  const issues = validateEvidenceRegistry({
    ...validRegistry,
    observations: [brokenObservation],
  });

  assert.ok(issues.some((issue) => issue.code === "missing-source"));
});

test("numeric ranges require ordered bounds and explicit units", () => {
  const brokenObservation = {
    ...evidenceObservations[0],
    id: "obs:test:invalid-range",
    variables: [
      {
        name: "brewRatio",
        role: "measurement",
        value: { kind: "range", min: 18, max: 13, unit: "" },
      },
    ],
  };
  const issues = validateEvidenceRegistry({
    ...validRegistry,
    observations: [brokenObservation],
  });

  assert.ok(issues.some((issue) => issue.code === "invalid-range"));
  assert.ok(issues.some((issue) => issue.code === "missing-unit"));
});

test("retracted sources cannot retain reviewed observations", () => {
  const retractedSource = {
    ...evidenceSources[0],
    status: "retracted",
  };
  const issues = validateEvidenceRegistry({
    ...validRegistry,
    sources: [retractedSource],
    observations: [evidenceObservations[0]],
  });

  assert.ok(issues.some((issue) => issue.code === "invalid-review-state"));
});

test("video locators reject an end time before the start time", () => {
  const brokenObservation = {
    ...evidenceObservations[0],
    id: "obs:test:invalid-locator",
    excerpt: {
      ...evidenceObservations[0].excerpt,
      locator: {
        timestampStartSeconds: 120,
        timestampEndSeconds: 90,
      },
    },
  };
  const issues = validateEvidenceRegistry({
    ...validRegistry,
    observations: [brokenObservation],
  });

  assert.ok(issues.some((issue) => issue.code === "invalid-locator"));
});
