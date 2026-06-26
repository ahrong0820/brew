import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import { advisorSourcesTetsuKasuya } from "../data/evidence/advisorSourcesTetsuKasuya.ts";
import { expertVideoProvenance } from "../data/evidence/expertVideoProvenance.ts";
import { checkExpertVideoProvenance } from "../lib/evidence/expertVideoQuality.ts";

const sourceId = "expert:tetsu-kasuya:wmCW8xSWGZY";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Tetsu Kasuya official 4:6 video source is registered", async () => {
  assert.equal(advisorSourcesTetsuKasuya.length, 1);
  const source = advisorSourcesTetsuKasuya[0];

  assert.equal(source.id, sourceId);
  assert.equal(source.type, "expert");
  assert.equal(source.medium, "video");
  assert.equal(source.title, "How to Brew Coffee Using the 4:6 Method");
  assert.equal(source.publisher, "Tetsu Kasuya");
  assert.equal(source.expertProfile.organization, "PHILOCOFFEA");
  assert.ok(source.expertProfile.credentials.includes("2016 World Brewers Cup Champion"));
  assert.ok(
    source.identifiers.some(
      (identifier) =>
        identifier.scheme === "youtube" && identifier.value === "wmCW8xSWGZY",
    ),
  );

  const registry = await readProjectFile("lib/evidence/registry.ts");
  assert.match(registry, /\.\.\.advisorSourcesTetsuKasuya/);
  assert.match(registry, /evidenceRegistryVersion = "1\.14\.0"/);
});

test("Tetsu Kasuya video has first-party channel provenance", () => {
  const source = advisorSourcesTetsuKasuya[0];
  const provenance = expertVideoProvenance.filter(
    (entry) => entry.sourceId === sourceId,
  );

  assert.equal(provenance.length, 1);
  assert.equal(provenance[0].ownership, "expert-official");
  assert.equal(provenance[0].channelUrl, "https://www.youtube.com/@TetsuKasuya");
  assert.ok(provenance[0].verificationMethod.includes("PHILOCOFFEA"));
  assert.ok(
    provenance[0].notes.some((note) => note.includes("wmCW8xSWGZY")),
  );
  assert.deepEqual(checkExpertVideoProvenance([source], provenance), []);
});

test("Tetsu Kasuya source-only batch has no observations or recommendation links", async () => {
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

test("source notes preserve the direct-verification boundary", () => {
  const source = advisorSourcesTetsuKasuya[0];

  assert.ok(source.notes.some((note) => note.includes("Source와 공식 채널 provenance")));
  assert.ok(source.notes.some((note) => note.includes("타임스탬프")));
  assert.ok(source.notes.some((note) => note.includes("Observation을 등록하지 않습니다")));
});
