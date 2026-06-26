import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { originVarietySources1 } from "../data/evidence/originVarietySources1.ts";
import { checkEvidenceSourceQuality } from "../lib/evidence/sourceQuality.ts";

const sourceIds = [
  "expert:world-coffee-research:varieties-catalog:about",
  "expert:world-coffee-research:varieties-catalog:bourbon",
  "expert:world-coffee-research:varieties-catalog:sl28",
  "expert:world-coffee-research:varieties-catalog:caturra",
];

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("official World Coffee Research catalog sources are registered", async () => {
  assert.equal(originVarietySources1.length, 4);
  assert.deepEqual(
    originVarietySources1.map((source) => source.id),
    sourceIds,
  );

  for (const source of originVarietySources1) {
    assert.equal(source.type, "expert");
    assert.equal(source.medium, "article");
    assert.equal(source.publisher, "World Coffee Research");
    assert.equal(source.authors[0].name, "World Coffee Research");
    assert.equal(source.expertProfile.organization, "World Coffee Research");
    assert.ok(source.canonicalUrl.startsWith("https://varieties.worldcoffeeresearch.org/"));
    assert.ok(
      source.identifiers.some(
        (identifier) =>
          identifier.scheme === "url" && identifier.value === source.canonicalUrl,
      ),
    );
  }

  assert.deepEqual(checkEvidenceSourceQuality(originVarietySources1), []);

  const registry = await readProjectFile("lib/evidence/registry.ts");
  assert.match(registry, /\.\.\.originVarietySources1/);
  assert.match(registry, /evidenceRegistryVersion = "\d+\.\d+\.\d+"/);
});

test("WCR source batch keeps catalog scope and variety pages distinct", () => {
  assert.deepEqual(
    originVarietySources1.map((source) => source.title),
    ["About the Catalog", "Bourbon", "SL28", "Caturra"],
  );
  assert.equal(
    new Set(originVarietySources1.map((source) => source.canonicalUrl)).size,
    originVarietySources1.length,
  );
});

test("WCR sources remain disconnected from candidate and active rules", async () => {
  const [candidateRules, activeRules] = await Promise.all([
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
  ]);
  for (const sourceId of sourceIds) {
    assert.equal(candidateRules.includes(sourceId), false);
    assert.equal(activeRules.includes(sourceId), false);
  }
});
