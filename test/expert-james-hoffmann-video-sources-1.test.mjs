import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import { advisorSourcesJamesHoffmann } from "../data/evidence/advisorSourcesJamesHoffmann.ts";
import { expertVideoProvenance } from "../data/evidence/expertVideoProvenance.ts";
import { checkExpertVideoProvenance } from "../lib/evidence/expertVideoQuality.ts";

const sourceId = "expert:james-hoffmann:1oB1oDrDkHM";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("James Hoffmann official V60 video source is registered", async () => {
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

  const registry = await readProjectFile("lib/evidence/registry.ts");
  assert.match(registry, /\.\.\.advisorSourcesJamesHoffmann/);
  assert.match(registry, /evidenceRegistryVersion = "1\.9\.0"/);
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

test("source-only batch does not invent observations or recommendation links", async () => {
  const evidenceDirectory = new URL("../data/evidence/", import.meta.url);
  const filenames = await readdir(evidenceDirectory);
  const observationFiles = filenames.filter((filename) =>
    /(Observation|Notes|observations)/.test(filename),
  );
  const observationTexts = await Promise.all(
    observationFiles.map((filename) =>
      readFile(new URL(filename, evidenceDirectory), "utf8"),
    ),
  );
  assert.ok(observationTexts.every((text) => !text.includes(sourceId)));

  const [candidateRules, activeRules] = await Promise.all([
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
  ]);
  assert.equal(candidateRules.includes(sourceId), false);
  assert.equal(activeRules.includes(sourceId), false);
});
