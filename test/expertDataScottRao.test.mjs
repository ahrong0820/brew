import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { advisorLineageScottRao } from "../data/evidence/advisorLineageScottRao.ts";
import { advisorSourcesScottRao } from "../data/evidence/advisorSourcesScottRao.ts";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("Scott Rao batch uses verified first-party sources", () => {
  assert.equal(advisorSourcesScottRao.length, 2);

  const [approach, grind] = advisorSourcesScottRao;
  assert.equal(approach.type, "expert");
  assert.equal(approach.title, "How to approach brewing different coffees");
  assert.equal(approach.publishedAt, "2024-02-26");
  assert.match(approach.canonicalUrl, /^https:\/\/www\.scottrao\.com\/blog\//);

  assert.equal(grind.type, "expert");
  assert.equal(grind.title, "How to choose a grind setting");
  assert.equal(grind.publishedAt, "2026-05-04");
  assert.match(grind.canonicalUrl, /^https:\/\/www\.scottrao\.com\/blog\//);

  for (const source of advisorSourcesScottRao) {
    assert.equal(source.accessedAt, "2026-06-26");
    assert.match(source.notes.join("\n"), /expert-opinion/);
    assert.match(source.notes.join("\n"), /project-maintainer, 2026-06-26/);
  }
});

test("Scott Rao claims preserve single-author lineage and registry integrity", async () => {
  assert.equal(advisorLineageScottRao.length, 1);
  const lineage = advisorLineageScottRao[0];
  assert.equal(lineage.independencePolicy, "single-author-family");
  assert.equal(lineage.sourceIds.length, 2);
  assert.equal(lineage.observationIds.length, 4);

  for (const sourceId of lineage.sourceIds) {
    assert.ok(advisorSourcesScottRao.some((source) => source.id === sourceId));
  }

  const observations = await readFile(
    new URL("../data/evidence/advisorNotesScottRao.ts", import.meta.url),
    "utf8",
  );
  const registry = await readFile(
    new URL("../lib/evidence/registry.ts", import.meta.url),
    "utf8",
  );

  for (const observationId of lineage.observationIds) {
    assert.match(observations, new RegExp(escapeRegExp(observationId)));
  }

  assert.match(observations, /sourceId: advisorSourcesScottRao\[0\]\.id/);
  assert.match(observations, /sourceId: advisorSourcesScottRao\[1\]\.id/);
  assert.equal(
    observations.match(/methodologicalStrength: "expert-opinion"/g)?.length,
    4,
  );
  assert.match(observations, /start-coarse-then-fine/);
  assert.match(observations, /PSD peak omits fines percentage/);

  assert.match(registry, /\.\.\.advisorSourcesScottRao/);
  assert.match(registry, /\.\.\.advisorNotesScottRao/);
  assert.match(registry, /evidenceLineages = \[\.\.\.advisorLineageScottRao\]/);
  assert.match(registry, /evidenceRegistryVersion = "1\.5\.0"/);
});
