import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { originVarietyObservations1 } from "../data/evidence/originVarietyObservations1.ts";
import { originVarietySources1 } from "../data/evidence/originVarietySources1.ts";
import { checkObservationTextQuality } from "../lib/evidence/observationTextQuality.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("verified WCR variety observations reference registered sources", async () => {
  assert.equal(originVarietyObservations1.length, 5);
  assert.equal(
    new Set(originVarietyObservations1.map((observation) => observation.id)).size,
    originVarietyObservations1.length,
  );

  const sourceIds = new Set(originVarietySources1.map((source) => source.id));
  for (const observation of originVarietyObservations1) {
    assert.equal(sourceIds.has(observation.sourceId), true);
    assert.equal(observation.reviewStatus, "reviewed");
    assert.equal(observation.assessment.extractionConfidence, "high");
    assert.equal(observation.assessment.directness, "indirect");
    assert.equal(observation.variables.length, 0);
    assert.ok(observation.tags.includes("fact"));
    assert.ok(observation.tags.includes("not-extraction-rule"));
  }

  assert.deepEqual(checkObservationTextQuality(originVarietyObservations1), []);

  const registry = await readProjectFile("lib/evidence/registry.ts");
  assert.match(registry, /\.\.\.originVarietyObservations1/);
  assert.match(registry, /evidenceRegistryVersion = "\d+\.\d+\.\d+"/);
});

test("WCR classifications preserve variety-specific values and latitude caveats", () => {
  const bourbon = originVarietyObservations1.find((observation) =>
    observation.id.includes("bourbon-altitude-quality"),
  );
  const sl28 = originVarietyObservations1.find((observation) =>
    observation.id.includes("sl28-altitude-quality-distribution"),
  );
  const caturra = originVarietyObservations1.find((observation) =>
    observation.id.includes("caturra-altitude-quality"),
  );

  assert.ok(bourbon?.summary.includes("Very Good"));
  assert.ok(bourbon?.summary.includes("High"));
  assert.deepEqual(bourbon?.context.bean?.varieties, ["Bourbon"]);

  assert.ok(sl28?.summary.includes("Exceptional"));
  assert.ok(sl28?.summary.includes("Medium·High"));
  assert.deepEqual(sl28?.context.bean?.varieties, ["SL28"]);

  assert.ok(caturra?.summary.includes("Good"));
  assert.ok(caturra?.summary.includes("High"));
  assert.deepEqual(caturra?.context.bean?.varieties, ["Caturra"]);

  for (const observation of [bourbon, sl28, caturra]) {
    assert.ok(
      observation?.assessment.limitations.some((limitation) =>
        limitation.includes("위도"),
      ),
    );
  }
});

test("historical Caturra locations are not encoded as current origin matching context", () => {
  const lineage = originVarietyObservations1.find((observation) =>
    observation.id.includes("caturra-lineage-origin-history"),
  );

  assert.ok(lineage?.summary.includes("Minas Gerais"));
  assert.ok(lineage?.summary.includes("1915~1918"));
  assert.deepEqual(lineage?.context.bean?.varieties, ["Caturra", "Bourbon"]);
  assert.equal(lineage?.context.bean?.originCountries, undefined);
  assert.equal(lineage?.context.bean?.originGroups, undefined);
  assert.equal(lineage?.context.bean?.originRegions, undefined);
});

test("WCR factual observations do not activate recommendation rules", async () => {
  const [candidateRules, activeRules] = await Promise.all([
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
  ]);

  for (const observation of originVarietyObservations1) {
    assert.equal(candidateRules.includes(observation.id), false);
    assert.equal(activeRules.includes(observation.id), false);
  }
});
