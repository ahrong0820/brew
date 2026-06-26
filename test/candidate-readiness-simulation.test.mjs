import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { candidateRules } from "../data/recommendation/candidateRules.ts";
import { candidateSimulationScenarios } from "../data/recommendation/candidateSimulationScenarios.ts";
import {
  createV60FoundationSteps,
  v60FoundationBloomWater,
  v60FoundationTargetTime,
} from "../lib/recommendation/v60Foundation.ts";

const grindCandidateId = "candidate:grind:v60-hot:dial-in-v1";
const pourCandidateId = "candidate:pour:v60-hot:foundation-v1";
const timeCandidateId = "candidate:time:v60-hot:foundation-v1";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("candidate catalog contains validated grind, pour and time rules", () => {
  assert.equal(candidateRules.length, 3);
  assert.deepEqual(
    candidateRules.map((candidate) => candidate.id),
    [grindCandidateId, pourCandidateId, timeCandidateId],
  );
  assert.ok(candidateRules.every((candidate) => candidate.status === "validated"));
  assert.deepEqual(
    candidateRules.map((candidate) => candidate.validationPlan.changedParameters[0]),
    ["grind", "pour", "time"],
  );
});

test("candidate scenario catalog covers values and scope boundaries", () => {
  assert.equal(candidateSimulationScenarios.length, 16);
  assert.equal(
    new Set(candidateSimulationScenarios.map((scenario) => scenario.id)).size,
    candidateSimulationScenarios.length,
  );

  const foundationScenarios = candidateSimulationScenarios.filter(
    (scenario) => scenario.candidateRuleId !== grindCandidateId,
  );
  assert.equal(foundationScenarios.length, 8);
  assert.equal(
    foundationScenarios.filter((scenario) => scenario.expectedDecision === "apply")
      .length,
    4,
  );
  assert.equal(
    foundationScenarios.filter(
      (scenario) => scenario.expectedDecision === "not-applicable",
    ).length,
    4,
  );
  assert.ok(
    foundationScenarios.some(
      (scenario) => scenario.context.drinkStyle === "iced",
    ),
  );
  assert.ok(
    foundationScenarios.some(
      (scenario) => scenario.context.brewerType === "switch",
    ),
  );
  assert.ok(
    foundationScenarios.some(
      (scenario) => scenario.context.filterMaterial === "metal",
    ),
  );
});

test("HOT V60 foundation helper preserves normalized recipe values", () => {
  assert.equal(v60FoundationBloomWater(15, 240), 45);
  assert.equal(v60FoundationBloomWater(22, 352), 65);
  assert.equal(v60FoundationBloomWater(20, 200), 50);
  assert.deepEqual(v60FoundationTargetTime, { min: 150, max: 180 });

  const steps = createV60FoundationSteps(15, 240);
  assert.deepEqual(
    steps.map((step) => ({
      startSeconds: step.startSeconds,
      targetWaterGrams: step.targetWaterGrams,
    })),
    [
      { startSeconds: 0, targetWaterGrams: 45 },
      { startSeconds: 30, targetWaterGrams: 240 },
    ],
  );
  assert.match(steps[0].cue, /30초/);
  assert.match(steps[1].cue, /종이 필터에 직접 붓지 않고/);
});

test("simulation implementation handles all promoted implementation keys", async () => {
  const simulation = await readProjectFile(
    "lib/recommendation/candidateSimulation.ts",
  );

  assert.match(simulation, /v60-hot-paper-grind-direction-v1/);
  assert.match(simulation, /v60-hot-paper-foundation-pour-v1/);
  assert.match(simulation, /v60-hot-paper-foundation-time-v1/);
  assert.match(simulation, /v60FoundationBloomWater/);
  assert.match(simulation, /v60FoundationTargetTime/);
  assert.match(simulation, /decision = "not-applicable"/);
  assert.match(simulation, /valuesMatch/);
});

test("initial recommendation candidates retain the stricter readiness policy", async () => {
  const readiness = await readProjectFile(
    "lib/recommendation/candidateReadiness.ts",
  );

  assert.match(readiness, /"initial-recommendation"/);
  assert.match(readiness, /minimumConfidenceScore: 0\.65/);
  assert.match(readiness, /minimumIndependentSupportFamilies: 2/);
  assert.match(readiness, /minimumEmpiricalSupportingObservations: 1/);
  assert.match(readiness, /maximumContradictingObservations: 0/);
  assert.match(readiness, /runCandidateSimulation/);
});

test("active recommendation engine uses promoted ids, never candidate ids", async () => {
  const [activeRules, engine] = await Promise.all([
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("lib/recommendation/engine.ts"),
  ]);

  for (const candidate of candidateRules) {
    assert.equal(activeRules.includes(candidate.id), false);
    assert.equal(activeRules.includes(candidate.promotion.ruleId), true);
  }
  assert.match(engine, /applyV60FoundationRecommendation/);
  assert.match(engine, /v60FoundationRuleIds/);
  assert.equal(engine.includes("candidateReadiness"), false);
  assert.equal(engine.includes("candidateSimulation"), false);
});
