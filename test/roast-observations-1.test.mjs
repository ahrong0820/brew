import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { roastObservations1 } from "../data/evidence/roastObservations1.ts";
import { roastSources1 } from "../data/evidence/roastSources1.ts";
import { checkObservationTextQuality } from "../lib/evidence/observationTextQuality.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("verified roast observations reference the registered paper source", async () => {
  assert.equal(roastObservations1.length, 3);
  assert.equal(
    new Set(roastObservations1.map((observation) => observation.id)).size,
    roastObservations1.length,
  );

  const sourceIds = new Set(roastSources1.map((source) => source.id));
  for (const observation of roastObservations1) {
    assert.equal(sourceIds.has(observation.sourceId), true);
    assert.equal(observation.reviewStatus, "reviewed");
    assert.equal(observation.assessment.extractionConfidence, "high");
    assert.equal(observation.assessment.directness, "indirect");
    assert.equal(observation.assessment.methodologicalStrength, "controlled");
    assert.equal(observation.assessment.reproducibility, "single-source");
    assert.ok(observation.tags.includes("not-extraction-rule"));
    assert.deepEqual(observation.context.brew?.doseGrams, {
      min: 50,
      max: 50,
      unit: "g",
    });
    assert.deepEqual(observation.context.brew?.waterGrams, {
      min: 900,
      max: 900,
      unit: "g",
    });
    assert.deepEqual(observation.context.brew?.temperatureCelsius, {
      min: 92,
      max: 92,
      unit: "celsius",
    });
    assert.deepEqual(observation.context.brew?.targetTimeSeconds, {
      min: 210,
      max: 210,
      unit: "seconds",
    });
  }

  assert.deepEqual(checkObservationTextQuality(roastObservations1), []);

  const registry = await readProjectFile("lib/evidence/registry.ts");
  assert.match(registry, /\.\.\.roastObservations1/);
  assert.match(registry, /evidenceRegistryVersion = "\d+\.\d+\.\d+"/);
});

test("roast observations preserve comparison scope and sensory directions", () => {
  const colour = roastObservations1.find((observation) =>
    observation.id.includes("colour-stronger-than-timing"),
  );
  const darker = roastObservations1.find((observation) =>
    observation.id.includes("darker-roast-sensory-direction"),
  );
  const development = roastObservations1.find((observation) =>
    observation.id.includes("development-time-over-first-crack"),
  );

  assert.ok(colour?.summary.includes("배전 색도"));
  assert.ok(colour?.summary.includes("더 강한 예측 변수"));
  assert.ok(
    colour?.assessment.limitations.some((limitation) =>
      limitation.includes("두 연구"),
    ),
  );

  assert.ok(darker?.summary.includes("쓴맛 증가"));
  assert.ok(darker?.summary.includes("산미·과일향·단맛 감소"));
  assert.equal(darker?.outcome?.variable, "sensoryBitterness");
  assert.equal(darker?.outcome?.direction, "increase");

  assert.ok(development?.summary.includes("개발 시간"));
  assert.ok(development?.summary.includes("1차 크랙"));
  assert.ok(
    development?.assessment.limitations.some((limitation) =>
      limitation.includes("Study 1"),
    ),
  );

  for (const observation of roastObservations1) {
    assert.ok(
      observation.assessment.limitations.some(
        (limitation) =>
          limitation.includes("프렌치프레스") ||
          limitation.includes("다른 브루어"),
      ),
    );
  }
});

test("roast observations do not activate recommendation rules", async () => {
  const [candidateRules, activeRules] = await Promise.all([
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
  ]);

  for (const observation of roastObservations1) {
    assert.equal(candidateRules.includes(observation.id), false);
    assert.equal(activeRules.includes(observation.id), false);
  }
});
