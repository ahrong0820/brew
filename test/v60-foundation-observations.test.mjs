import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { v60FoundationObservations1 } from "../data/evidence/v60FoundationObservations1.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("HOT V60 foundation observations are reviewed and uniquely identified", () => {
  assert.equal(v60FoundationObservations1.length, 7);
  assert.equal(
    new Set(v60FoundationObservations1.map((observation) => observation.id)).size,
    7,
  );
  assert.ok(
    v60FoundationObservations1.every(
      (observation) => observation.reviewStatus === "reviewed",
    ),
  );
});

test("observations preserve the directly verified numeric boundaries", () => {
  const text = JSON.stringify(v60FoundationObservations1);
  assert.match(text, /bloomTimeSeconds/);
  assert.match(text, /v60-ratio-range/);
  assert.match(text, /v60-typical-contact-time/);
  assert.match(text, /v60-temperature-range/);
  assert.match(text, /serving-dose-reference/);
  assert.match(text, /three-minute-ceiling/);
});

test("registry and validation script include the new observations", async () => {
  const [registry, validation] = await Promise.all([
    readProjectFile("lib/evidence/registry.ts"),
    readProjectFile("scripts/validate-evidence.mjs"),
  ]);

  assert.match(registry, /\.\.\.v60FoundationObservations1/);
  assert.match(registry, /evidenceRegistryVersion = "1\.16\.0"/);
  assert.match(validation, /\.\.\.v60FoundationObservations1/);
});
