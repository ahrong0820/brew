import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Scott Rao batch preserves verified first-party source metadata", async () => {
  const sources = await readProjectFile(
    "data/evidence/advisorSourcesScottRao.ts",
  );

  assert.match(sources, /How to approach brewing different coffees/);
  assert.match(sources, /publishedAt: "2024-02-26"/);
  assert.match(
    sources,
    /https:\/\/www\.scottrao\.com\/blog\/2024\/2\/26\/how-to-approach-brewing-different-coffees/,
  );
  assert.match(sources, /How to choose a grind setting/);
  assert.match(sources, /publishedAt: "2026-05-04"/);
  assert.match(
    sources,
    /https:\/\/www\.scottrao\.com\/blog\/how-to-choose-a-grind-setting/,
  );
  assert.equal((sources.match(/type: "expert"/g) ?? []).length, 2);
  assert.equal((sources.match(/expert-opinion/g) ?? []).length, 2);
  assert.equal(
    (sources.match(/검수: project-maintainer, 2026-06-26/g) ?? []).length,
    2,
  );
});

test("Scott Rao claims preserve source references and single-author lineage", async () => {
  const [observations, lineage, registry] = await Promise.all([
    readProjectFile("data/evidence/advisorNotesScottRao.ts"),
    readProjectFile("data/evidence/advisorLineageScottRao.ts"),
    readProjectFile("lib/evidence/registry.ts"),
  ]);

  const observationIds = [
    "obs:expert-data-2:foundational-recipe-grind-first",
    "obs:expert-data-2:target-time-over-nominal-setting",
    "obs:expert-data-2:grind-setting-context-dependence",
    "obs:expert-data-2:coarse-first-recovery",
  ];

  for (const observationId of observationIds) {
    assert.ok(observations.includes(observationId));
    assert.ok(lineage.includes(observationId));
  }

  assert.match(observations, /sourceId: advisorSourcesScottRao\[0\]\.id/);
  assert.match(observations, /sourceId: advisorSourcesScottRao\[1\]\.id/);
  assert.equal(
    (observations.match(/methodologicalStrength: "expert-opinion"/g) ?? [])
      .length,
    4,
  );
  assert.match(observations, /start-coarse-then-fine/);
  assert.match(observations, /PSD peak omits fines percentage/);

  assert.match(lineage, /independencePolicy: "single-author-family"/);
  assert.match(lineage, /두 글을 서로 독립적인 전문가 지지 두 건으로 합산하지 않습니다/);

  assert.match(registry, /\.\.\.advisorSourcesScottRao/);
  assert.match(registry, /\.\.\.advisorNotesScottRao/);
  assert.match(registry, /evidenceLineages = \[\.\.\.advisorLineageScottRao\]/);
  assert.match(registry, /evidenceRegistryVersion = "1\.5\.0"/);
});
