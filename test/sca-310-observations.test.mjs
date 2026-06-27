import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { researchBatch1Observations } from "../data/evidence/researchBatch1Observations.ts";
import { standardsBrewing1Observations } from "../data/evidence/standardsBrewing1Observations.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("SCA 310 observations preserve ratio, slurry temperature and exclusion", () => {
  assert.equal(standardsBrewing1Observations.length, 3);
  assert.equal(
    new Set(standardsBrewing1Observations.map((observation) => observation.id)).size,
    3,
  );
  assert.ok(
    standardsBrewing1Observations.every(
      (observation) => observation.reviewStatus === "reviewed",
    ),
  );

  const ratio = standardsBrewing1Observations.find((observation) =>
    observation.id.includes("brew-ratio"),
  );
  const temperature = standardsBrewing1Observations.find((observation) =>
    observation.id.includes("brewing-temperature"),
  );
  const scope = standardsBrewing1Observations.find((observation) =>
    observation.id.includes("manual-pour-over-excluded"),
  );

  assert.ok(ratio);
  assert.ok(temperature);
  assert.ok(scope);
  assert.equal(ratio.variables[0].value.value, 55);
  assert.equal(ratio.variables[0].value.unit, "coffee g per water kg");
  assert.deepEqual(temperature.variables[0].value, {
    kind: "range",
    min: 90,
    max: 96,
    unit: "celsius",
  });
  assert.ok(temperature.assessment.limitations.some((note) => note.includes("슬러리")));
  assert.ok(scope.summary.includes("수동 푸어오버"));
  assert.equal(scope.variables.length, 0);
  assert.ok(
    standardsBrewing1Observations.every((observation) =>
      observation.tags.includes("standard"),
    ),
  );
});

test("controlled temperature observation preserves matched extraction limits", () => {
  assert.equal(researchBatch1Observations.length, 3);
  const observation = researchBatch1Observations.find(
    (candidate) => candidate.id === "obs:research-batch-1:temperature",
  );

  assert.ok(observation);
  assert.equal(observation.reviewStatus, "reviewed");
  assert.deepEqual(observation.context.brew.temperatureCelsius, {
    min: 87,
    max: 93,
    unit: "celsius",
  });
  assert.ok(
    observation.variables.some(
      (variable) =>
        variable.name === "beverageTdsPercent" && variable.role === "control",
    ),
  );
  assert.ok(
    observation.variables.some(
      (variable) =>
        variable.name === "extractionYieldPercent" && variable.role === "control",
    ),
  );
  assert.ok(
    observation.assessment.limitations.some((note) =>
      note.includes("분쇄도, 유량과 투입 비율"),
    ),
  );
  assert.ok(
    observation.assessment.limitations.some((note) => note.includes("수동 V60")),
  );
});

test("SCA observations retain their scope boundaries", async () => {
  const [baseRules, baseEngine, registry] = await Promise.all([
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("lib/recommendation/baseEngine.ts"),
    readProjectFile("lib/evidence/registry.ts"),
  ]);

  assert.equal(
    baseRules.includes("obs:standard:sca-310:brew-ratio-55-g-per-kg"),
    false,
  );
  assert.match(baseEngine, /temperatureProcessOffset/);
  assert.match(baseEngine, /temperatureTasteOffset/);
  assert.match(registry, /evidenceRegistryVersion = "1\.21\.0"/);
});
