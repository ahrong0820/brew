import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { standardsBrewing1Sources } from "../data/evidence/standardsBrewing1.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("SCA 310 source records the official standard and scope boundary", () => {
  assert.equal(standardsBrewing1Sources.length, 1);
  const source = standardsBrewing1Sources[0];

  assert.equal(source.id, "expert:sca:standard-310-2021-home-brewers");
  assert.equal(source.publisher, "Specialty Coffee Association");
  assert.match(source.title, /SCA Standard 310-2021/);
  assert.match(source.canonicalUrl, /sca\.coffee\/research\/coffee-standards/);
  assert.ok(source.identifiers.some((identifier) => identifier.value === "SCA-310-2021"));
  assert.ok(source.notes.some((note) => note.includes("수동 푸어오버")));
  assert.ok(source.notes.some((note) => note.includes("55 g\/kg")));
  assert.ok(source.notes.some((note) => note.includes("90~96°C")));
});

test("source stays separate from its reviewed Observation batch", async () => {
  const [registry, validation, sourceFile] = await Promise.all([
    readProjectFile("lib/evidence/registry.ts"),
    readProjectFile("scripts/validate-evidence.mjs"),
    readProjectFile("data/evidence/standardsBrewing1.ts"),
  ]);

  assert.match(registry, /import \{ standardsBrewing1Sources \}/);
  assert.match(registry, /import \{ standardsBrewing1Observations \}/);
  assert.match(registry, /\.\.\.standardsBrewing1Sources/);
  assert.match(registry, /\.\.\.standardsBrewing1Observations/);
  assert.match(registry, /evidenceRegistryVersion = "1\.20\.0"/);
  assert.match(validation, /\.\.\.standardsBrewing1Sources/);
  assert.match(validation, /\.\.\.standardsBrewing1Observations/);
  assert.equal(sourceFile.includes("EvidenceObservation"), false);
});
