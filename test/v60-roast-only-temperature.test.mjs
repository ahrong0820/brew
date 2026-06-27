import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { v60TemperatureCandidateRules } from "../data/recommendation/v60TemperatureCandidateRules.ts";
import { v60TemperatureRules } from "../data/recommendation/v60TemperatureRules.ts";
import { v60TemperatureSimulationScenarios } from "../data/recommendation/v60TemperatureSimulationScenarios.ts";
import {
  applyV60RoastOnlyTemperature,
  v60RoastOnlyTemperature,
  v60RoastOnlyTemperatureRuleId,
} from "../lib/recommendation/v60RoastOnlyTemperature.ts";

const candidateId = "candidate:temperature:v60-hot:roast-only-v1";
const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

function recommendation(temperatureCelsius = 92) {
  return {
    templateName: "test",
    doseGrams: 15,
    waterGrams: 240,
    ratio: 16,
    temperatureCelsius,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 180,
    grinder: {
      displayValue: "7.0",
      displayRange: "6.8~7.2",
      commonDescription: "중간 분쇄",
      calibrationLabel: "test",
      isNumeric: true,
      note: "test",
    },
    steps: [],
    reasons: [
      "Temperature Test의 배전도를 기준으로 물 온도를 설정했습니다.",
      "가공 향의 과도한 추출을 줄이도록 온도와 분쇄도를 보수적으로 조정했습니다.",
    ],
    confidence: "medium",
    confidenceReason: "test",
  };
}

function input({
  roastLevel = "light",
  process = "washed",
  tasteGoal = "balanced",
  brewer = "v60",
  drinkStyle = "hot",
} = {}) {
  return {
    bean: {
      id: "bean-temperature-test",
      name: "Temperature Test",
      originCountry: "ethiopia",
      originGroup: "east-africa",
      roastLevel,
      process,
      createdAt: "2026-06-27T00:00:00Z",
      updatedAt: "2026-06-27T00:00:00Z",
    },
    grinder: {
      id: "grinder-test",
      model: "1zpresso-k-ultra",
      displayName: "Test Grinder",
      calibrationProfile: "burr-no-rub",
      calibrationLabel: "Test",
      calibrationStatus: "user-calibrated",
      recommendationStatus: "primary",
      displayUnit: "dial",
      adjustmentDirection: "higher-is-coarser",
      displayStep: 0.1,
      personalOffset: 0,
      notes: [],
      isBuiltIn: false,
      createdAt: "2026-06-27T00:00:00Z",
      updatedAt: "2026-06-27T00:00:00Z",
    },
    preferences: {
      defaultBrewer: brewer,
      defaultDoseGrams: 15,
      defaultWaterGrams: 240,
      defaultDrinkStyle: drinkStyle,
      defaultGrinderProfileId: "grinder-test",
      defaultTasteGoal: tasteGoal,
      updatedAt: "2026-06-27T00:00:00Z",
    },
    tasteGoal,
  };
}

test("candidate data satisfies promotion thresholds and dry-run cases", async () => {
  assert.equal(v60TemperatureCandidateRules.length, 1);
  const candidate = v60TemperatureCandidateRules[0];
  assert.equal(candidate.id, candidateId);
  assert.equal(candidate.status, "validated");
  assert.equal(candidate.confidenceScore, 0.74);
  assert.equal(candidate.supportingObservationIds.length, 3);
  assert.equal(candidate.limitingObservationIds.length, 1);
  assert.equal(candidate.validationPlan.scenarioIds.length, 8);

  assert.equal(v60TemperatureSimulationScenarios.length, 8);
  const applicable = v60TemperatureSimulationScenarios.filter(
    (scenario) => scenario.expectedDecision === "apply",
  );
  const outOfScope = v60TemperatureSimulationScenarios.filter(
    (scenario) => scenario.expectedDecision === "not-applicable",
  );
  assert.equal(applicable.length, 5);
  assert.equal(outOfScope.length, 3);
  for (const scenario of applicable) {
    assert.equal(
      v60RoastOnlyTemperature(scenario.recipeInput.roastLevel),
      scenario.expectedValues.temperatureCelsius,
      scenario.id,
    );
  }

  const [readiness, simulation, candidateRegistry] = await Promise.all([
    readProjectFile("lib/recommendation/candidateReadiness.ts"),
    readProjectFile("lib/recommendation/candidateSimulation.ts"),
    readProjectFile("lib/recommendation/candidateRuleRegistry.ts"),
  ]);
  assert.match(readiness, /minimumConfidenceScore: 0\.65/);
  assert.match(readiness, /minimumIndependentSupportFamilies: 2/);
  assert.match(readiness, /minimumEmpiricalSupportingObservations: 1/);
  assert.match(simulation, /\.\.\.v60TemperatureSimulationScenarios/);
  assert.match(simulation, /v60-hot-paper-roast-only-temperature-v1/);
  assert.match(candidateRegistry, /candidateRuleRegistryVersion = "1\.5\.0"/);
  assert.match(candidateRegistry, /v60TemperatureCandidateRules/);
});

test("roast baseline is stable across taste goals and process methods", () => {
  assert.equal(v60RoastOnlyTemperature("light"), 94);
  assert.equal(v60RoastOnlyTemperature("medium-light"), 92);
  assert.equal(v60RoastOnlyTemperature("medium"), 90);
  assert.equal(v60RoastOnlyTemperature("medium-dark"), 88);
  assert.equal(v60RoastOnlyTemperature("dark"), 85);
  assert.equal(v60RoastOnlyTemperature("unknown"), 91);

  const washedBright = applyV60RoastOnlyTemperature(
    recommendation(95),
    input({ process: "washed", tasteGoal: "bright" }),
  );
  const naturalBody = applyV60RoastOnlyTemperature(
    recommendation(92),
    input({ process: "natural", tasteGoal: "body" }),
  );
  const fermentedBright = applyV60RoastOnlyTemperature(
    recommendation(93),
    input({ process: "fermented", tasteGoal: "bright" }),
  );

  assert.equal(washedBright.temperatureCelsius, 94);
  assert.equal(naturalBody.temperatureCelsius, 94);
  assert.equal(fermentedBright.temperatureCelsius, 94);
  assert.equal(
    naturalBody.reasons.some((reason) => reason.includes("가공 향의 과도한 추출")),
    false,
  );
  assert.ok(
    naturalBody.reasons.some((reason) =>
      reason.includes("별도 오프셋을 더하지 않았습니다"),
    ),
  );
});

test("personal temperature history remains additive after the initial rule", async () => {
  const personalized = await readProjectFile("lib/recommendation/personalized.ts");
  assert.match(personalized, /applyV60RoastOnlyTemperature/);
  assert.match(personalized, /createRecommendation\(input\)/);
  assert.match(personalized, /base\.temperatureCelsius \+ temperatureOffset/);
  assert.match(personalized, /개인 보정값을 반영했습니다/);
});

test("non-HOT-V60 recommendations remain unchanged by the specific rule", () => {
  const base = recommendation(92);
  const switchRecommendation = applyV60RoastOnlyTemperature(
    base,
    input({ brewer: "switch", process: "natural", tasteGoal: "body" }),
  );
  const icedRecommendation = applyV60RoastOnlyTemperature(
    base,
    input({ drinkStyle: "iced", process: "natural", tasteGoal: "body" }),
  );
  assert.equal(switchRecommendation, base);
  assert.equal(icedRecommendation, base);
  assert.equal(switchRecommendation.temperatureCelsius, 92);
  assert.equal(icedRecommendation.temperatureCelsius, 92);
});

test("active rule and engine use the promoted id, never the candidate id", async () => {
  assert.equal(v60TemperatureRules.length, 1);
  const rule = v60TemperatureRules[0];
  assert.equal(rule.id, v60RoastOnlyTemperatureRuleId);
  assert.equal(rule.parameter, "temperature");
  assert.equal(rule.status, "active");

  const [engine, ruleRegistry] = await Promise.all([
    readProjectFile("lib/recommendation/engine.ts"),
    readProjectFile("lib/recommendation/ruleRegistry.ts"),
  ]);
  assert.match(engine, /v60RoastOnlyTemperatureRuleId/);
  assert.equal(engine.includes(candidateId), false);
  assert.match(ruleRegistry, /recommendationRuleRegistryVersion = "1\.6\.0"/);
  assert.match(ruleRegistry, /v60TemperatureRules/);
});
