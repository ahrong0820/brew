import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { researchBatch1Observations } from "../data/evidence/researchBatch1Observations.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const strengthObservationId = "obs:research-batch-1:tds-pe-sensory-profile";
const couplingObservationId = "obs:research-batch-1:brew-ratio-coupled-control";

test("controlled drip study now separates strength profile and ratio coupling", () => {
  assert.equal(researchBatch1Observations.length, 3);
  assert.equal(
    new Set(researchBatch1Observations.map((observation) => observation.id)).size,
    3,
  );
  assert.ok(
    researchBatch1Observations.every(
      (observation) => observation.reviewStatus === "reviewed",
    ),
  );

  const strength = researchBatch1Observations.find(
    (observation) => observation.id === strengthObservationId,
  );
  const coupling = researchBatch1Observations.find(
    (observation) => observation.id === couplingObservationId,
  );

  assert.ok(strength);
  assert.ok(coupling);
  assert.ok(
    strength.variables.some(
      (variable) =>
        variable.name === "beverageTdsPercent" &&
        variable.value.kind === "range" &&
        variable.value.min === 1 &&
        variable.value.max === 1.5,
    ),
  );
  assert.ok(
    strength.variables.some(
      (variable) =>
        variable.name === "extractionYieldPercent" &&
        variable.value.kind === "range" &&
        variable.value.min === 16 &&
        variable.value.max === 24,
    ),
  );
  assert.equal(strength.outcome.variable, "sensoryBody");
  assert.equal(strength.outcome.direction, "association");
  assert.ok(strength.outcome.sensoryDescription.includes("높은 TDS"));
  assert.ok(
    coupling.variables.some(
      (variable) =>
        variable.name === "brewRatio" &&
        variable.value.kind === "text" &&
        variable.value.value.includes("varied jointly"),
    ),
  );
});

test("observations preserve automatic-drip and non-independent limitations", () => {
  const strength = researchBatch1Observations.find(
    (observation) => observation.id === strengthObservationId,
  );
  const coupling = researchBatch1Observations.find(
    (observation) => observation.id === couplingObservationId,
  );

  assert.ok(strength);
  assert.ok(coupling);
  assert.deepEqual(strength.context.brew.brewerTypes, ["other"]);
  assert.deepEqual(strength.context.brew.filterMaterials, ["paper"]);
  assert.ok(
    strength.assessment.limitations.some((note) => note.includes("수동 V60")),
  );
  assert.ok(
    coupling.assessment.limitations.some((note) =>
      note.includes("독립적인 감각 효과를 분리한 비교가 아닙니다"),
    ),
  );
  assert.ok(
    coupling.assessment.limitations.some((note) =>
      note.includes("1:15·1:15.5·1:16·1:16.5"),
    ),
  );
});

test("new Observations are validated but do not change active ratio values", async () => {
  const [registry, validation, normalization, baseRules, temperatureRules] =
    await Promise.all([
      readProjectFile("lib/evidence/registry.ts"),
      readProjectFile("scripts/validate-evidence.mjs"),
      readProjectFile("lib/recommendation/normalization.ts"),
      readProjectFile("data/recommendation/rules.ts"),
      readProjectFile("data/recommendation/v60TemperatureRules.ts"),
    ]);
  const activeRuleFiles = `${baseRules}\n${temperatureRules}`;

  assert.match(registry, /evidenceRegistryVersion = "1\.21\.0"/);
  assert.match(registry, /\.\.\.researchBatch1Observations/);
  assert.match(validation, /\.\.\.researchBatch1Observations/);
  assert.match(normalization, /sweet: 15\.5/);
  assert.match(normalization, /bright: 16\.5/);
  assert.match(normalization, /balanced: 16/);
  assert.match(normalization, /body: 15/);
  assert.equal(activeRuleFiles.includes(strengthObservationId), false);
  assert.equal(activeRuleFiles.includes(couplingObservationId), false);
});
