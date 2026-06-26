import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { candidateRules } from "../data/recommendation/candidateRules.ts";
import { assessCandidateReadiness } from "../lib/recommendation/candidateReadiness.ts";
import { runCandidateSimulation } from "../lib/recommendation/candidateSimulation.ts";

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

test("candidate dry-run passes in-scope and out-of-scope scenarios", () => {
  const report = runCandidateSimulation(candidateRuleId);

  assert.equal(report.totalScenarios, 8);
  assert.equal(report.passedScenarios, 8);
  assert.equal(report.failedScenarios, 0);
  assert.equal(report.allPassed, true);

  const decisions = report.results.map((result) => result.decision);
  assert.equal(decisions.filter((decision) => decision === "finer").length, 2);
  assert.equal(decisions.filter((decision) => decision === "coarser").length, 2);
  assert.equal(decisions.filter((decision) => decision === "hold").length, 1);
  assert.equal(
    decisions.filter((decision) => decision === "not-applicable").length,
    3,
  );

  for (const result of report.results) {
    assert.ok(
      result.changedParameters.length === 0 ||
        (result.changedParameters.length === 1 &&
          result.changedParameters[0] === "grind"),
    );
  }
});

test("readiness assessment permits simulation but blocks promotion", () => {
  const assessment = assessCandidateReadiness(candidateRuleId);

  assert.equal(assessment.stage, "simulation-ready");
  assert.equal(assessment.targetLayer, "post-brew-adjustment");
  assert.equal(assessment.simulation?.allPassed, true);
  assert.deepEqual(assessment.simulationBlockers, []);
  assert.equal(assessment.metrics.independentSupportFamilyCount, 2);
  assert.equal(assessment.metrics.empiricalSupportingObservationCount, 0);
  assert.equal(assessment.metrics.confidenceScore, 0.46);

  const blockerCodes = assessment.promotionBlockers.map((blocker) => blocker.code);
  assert.ok(blockerCodes.includes("confidence-below-policy"));
  assert.ok(blockerCodes.includes("empirical-support-missing"));
  assert.equal(blockerCodes.includes("independent-support-insufficient"), false);
  assert.deepEqual(assessment.warnings, [
    "모든 지지 Observation의 재현성 분류가 single-source입니다.",
  ]);
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
