import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { roastSources1 } from "../data/evidence/roastSources1.ts";
import { checkEvidenceSourceQuality } from "../lib/evidence/sourceQuality.ts";

const sourceId = "paper:doi:10.3390/beverages6020029";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("official roast research source is registered with verified metadata", async () => {
  assert.equal(roastSources1.length, 1);
  const source = roastSources1[0];

  assert.equal(source.id, sourceId);
  assert.equal(source.type, "paper");
  assert.equal(
    source.title,
    "Roasting Conditions and Coffee Flavor: A Multi-Study Empirical Investigation",
  );
  assert.deepEqual(
    source.authors.map((author) => author.name),
    ["Morten Münchow", "Jesper Alstrup", "Ida Steen", "Davide Giacalone"],
  );
  assert.equal(source.publisher, "MDPI");
  assert.equal(source.publishedAt, "2020-05-08");
  assert.equal(source.journal, "Beverages");
  assert.equal(source.volume, "6");
  assert.equal(source.issue, "2");
  assert.equal(source.peerReviewStatus, "peer-reviewed");
  assert.equal(source.canonicalUrl, "https://www.mdpi.com/2306-5710/6/2/29");
  assert.ok(
    source.identifiers.some(
      (identifier) =>
        identifier.scheme === "doi" &&
        identifier.value === "10.3390/beverages6020029",
    ),
  );
  assert.deepEqual(checkEvidenceSourceQuality(roastSources1), []);

  const registry = await readProjectFile("lib/evidence/registry.ts");
  assert.match(registry, /\.\.\.roastSources1/);
  assert.match(registry, /evidenceRegistryVersion = "\d+\.\d+\.\d+"/);
});

test("roast research source remains disconnected from recommendation rules", async () => {
  const [candidateRules, activeRules] = await Promise.all([
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
  ]);
  assert.equal(candidateRules.includes(sourceId), false);
  assert.equal(activeRules.includes(sourceId), false);
});
