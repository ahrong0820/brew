import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { candidateRules } from "../data/recommendation/candidateRules.ts";
import { candidateSimulationScenarios } from "../data/recommendation/candidateSimulationScenarios.ts";

const candidateRuleId = "candidate:grind:v60-hot:dial-in-v1";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("V60 grind candidate has a single-variable post-brew validation plan", () => {
  const candidate = candidateRules.find((rule) => rule.id === candidateRuleId);
  assert.ok(candidate);
  assert.equal(candidate.validationPlan.targetLayer, "post-brew-adjustment");
  assert.equal(
    candidate.validationPlan.implementationKey,
    "v60-hot-paper-grind-direction-v1",
  );
  assert.deepEqual(candidate.validationPlan.changedParameters, ["grind"]);
  assert.deepEqual(candidate.validationPlan.heldConstantParameters, [
    "dose",
    "ratio",
    "temperature",
    "pour",
  ]);
  assert.equal(candidate.validationPlan.scenarioIds.length, 8);
  assert.ok(candidate.validationPlan.acceptanceCriteria.length >= 5);
});

test("candidate scenario catalog covers decisions and scope boundaries", () => {
  assert.equal(candidateSimulationScenarios.length, 8);
  assert.equal(
    new Set(candidateSimulationScenarios.map((scenario) => scenario.id)).size,
    candidateSimulationScenarios.length,
  );

  const decisions = candidateSimulationScenarios.map(
    (scenario) => scenario.expectedDecision,
  );
  assert.equal(decisions.filter((decision) => decision === "finer").length, 2);
  assert.equal(decisions.filter((decision) => decision === "coarser").length, 2);
  assert.equal(decisions.filter((decision) => decision === "hold").length, 1);
  assert.equal(
    decisions.filter((decision) => decision === "not-applicable").length,
    3,
  );

  const outOfScope = candidateSimulationScenarios.filter(
    (scenario) => scenario.expectedDecision === "not-applicable",
  );
  assert.ok(outOfScope.some((scenario) => scenario.context.brewerType === "switch"));
  assert.ok(outOfScope.some((scenario) => scenario.context.drinkStyle === "iced"));
  assert.ok(
    outOfScope.some((scenario) => scenario.context.filterMaterial === "metal"),
  );
});

test("simulation implementation enforces scope, direction and one-variable output", async () => {
  const simulation = await readProjectFile(
    "lib/recommendation/candidateSimulation.ts",
  );

  assert.match(simulation, /matchesScope/);
  assert.match(simulation, /actualTimeSeconds < signal\.targetTimeMinSeconds - 10/);
  assert.match(simulation, /actualTimeSeconds > signal\.targetTimeMaxSeconds \+ 10/);
  assert.match(simulation, /tastingResult === "bitter-astringent"/);
  assert.match(simulation, /return "hold"/);
  assert.match(simulation, /decision = "not-applicable"/);
  assert.match(simulation, /\["grind"\] as const/);
  assert.match(simulation, /changedParameters\.every/);
});

test("readiness policy permits simulation but blocks unsupported promotion", async () => {
  const readiness = await readProjectFile(
    "lib/recommendation/candidateReadiness.ts",
  );

  assert.match(readiness, /minimumConfidenceScore: 0\.65/);
  assert.match(readiness, /minimumIndependentSupportFamilies: 2/);
  assert.match(readiness, /minimumEmpiricalSupportingObservations: 1/);
  assert.match(readiness, /maximumContradictingObservations: 0/);
  assert.match(readiness, /single-author-family/);
  assert.match(readiness, /"simulation-ready"/);
  assert.match(readiness, /"confidence-below-policy"/);
  assert.match(readiness, /"empirical-support-missing"/);
  assert.match(readiness, /reproducibility === "single-source"/);
});

test("readiness and simulation remain disconnected from active recommendations", async () => {
  const [activeRules, engine, adjustment] = await Promise.all([
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("lib/recommendation/engine.ts"),
    readProjectFile("lib/recommendation/adjustment.ts"),
  ]);

  assert.equal(activeRules.includes(candidateRuleId), false);
  assert.equal(engine.includes("candidateReadiness"), false);
  assert.equal(engine.includes("candidateSimulation"), false);
  assert.equal(adjustment.includes("candidateReadiness"), false);
  assert.equal(adjustment.includes("candidateSimulation"), false);
});
