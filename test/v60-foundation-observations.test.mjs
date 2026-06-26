import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { v60FoundationObservations1 } from "../data/evidence/v60FoundationObservations1.ts";

const byId = new Map(
  v60FoundationObservations1.map((observation) => [observation.id, observation]),
);

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("HOT V60 foundation observations are reviewed and directly scoped", () => {
  assert.equal(v60FoundationObservations1.length, 7);
  assert.equal(new Set(byId.keys()).size, 7);
  assert.ok(
    v60FoundationObservations1.every(
      (observation) =>
        observation.reviewStatus === "reviewed" &&
        observation.context.brew?.brewerTypes?.includes("v60") &&
        observation.context.brew?.drinkStyles?.includes("hot") &&
        observation.context.brew?.filterMaterials?.includes("paper"),
    ),
  );
});

test("HARIO observations preserve the official procedure and serving limitation", () => {
  const bloom = byId.get("obs:manufacturer:hario-v60:bloom-circular-pour");
  const time = byId.get("obs:manufacturer:hario-v60:three-minute-ceiling");
  const serving = byId.get("obs:manufacturer:hario-v60:serving-dose-reference");

  assert.ok(bloom.variables.some((variable) => variable.name === "bloomTimeSeconds" && variable.value.value === 30));
  assert.ok(time.variables.some((variable) => variable.name === "targetTimeSeconds" && variable.value.max === 180));
  assert.ok(serving.assessment.limitations.some((limitation) => limitation.includes("brew ratio")));
});

test("Coffee ad Astra observations retain ratio, bloom, time and temperature boundaries", () => {
  const ratio = byId.get("obs:expert-data-1:v60-ratio-range");
  const workflow = byId.get("obs:expert-data-1:v60-three-x-bloom-workflow");
  const time = byId.get("obs:expert-data-1:v60-typical-contact-time");
  const temperature = byId.get("obs:expert-data-1:v60-temperature-range");

  assert.deepEqual(ratio.context.brew.ratio, { min: 15, max: 17, unit: "water g per coffee g" });
  assert.ok(workflow.variables.some((variable) => variable.name === "bloomRatio" && variable.value.value === 3));
  assert.ok(workflow.assessment.limitations.some((limitation) => limitation.includes("타임스탬프")));
  assert.deepEqual(time.context.brew.targetTimeSeconds, { min: 150, max: 210, unit: "s" });
  assert.deepEqual(temperature.context.brew.temperatureCelsius, { min: 91, max: 94, unit: "°C recommendation range" });
  assert.equal(temperature.assessment.extractionConfidence, "low");
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
