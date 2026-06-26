import assert from "node:assert/strict";
import test from "node:test";

import { advisorSourcesJamesHoffmann } from "../data/evidence/advisorSourcesJamesHoffmann.ts";
import { expertVideoProvenance } from "../data/evidence/expertVideoProvenance.ts";
import { checkExpertVideoProvenance } from "../lib/evidence/expertVideoQuality.ts";
import {
  evidenceRegistry,
  listEvidenceObservationsForSource,
} from "../lib/evidence/registry.ts";

const sourceId = "expert:james-hoffmann:1oB1oDrDkHM";

test("James Hoffmann official V60 video source is registered", () => {
  assert.equal(advisorSourcesJamesHoffmann.length, 1);
  const source = advisorSourcesJamesHoffmann[0];
  assert.equal(source.id, sourceId);
  assert.equal(source.type, "expert");
  assert.equal(source.medium, "video");
  assert.equal(source.title, "A Better 1 Cup V60 Technique");
  assert.ok(
    source.identifiers.some(
      (identifier) =>
        identifier.scheme === "youtube" && identifier.value === "1oB1oDrDkHM",
    ),
  );
  assert.ok(evidenceRegistry.sources.some((entry) => entry.id === sourceId));
});

test("James Hoffmann video has first-party channel provenance", () => {
  const source = advisorSourcesJamesHoffmann[0];
  const provenance = expertVideoProvenance.filter(
    (entry) => entry.sourceId === sourceId,
  );
  assert.equal(provenance.length, 1);
  assert.equal(provenance[0].ownership, "expert-official");
  assert.deepEqual(checkExpertVideoProvenance([source], provenance), []);
});

test("source-only batch does not invent video observations", () => {
  assert.deepEqual(listEvidenceObservationsForSource(sourceId), []);
});
