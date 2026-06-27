import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { v60RatioCandidateRules } from "../data/recommendation/v60RatioCandidateRules.ts";
import { v60RatioRules } from "../data/recommendation/v60RatioRules.ts";
import { v60RatioSimulationScenarios } from "../data/recommendation/v60RatioSimulationScenarios.ts";
import {
  applyV60FoundationRatio,
  v60FoundationRatio,
  v60FoundationRatioRuleId,
} from "../lib/recommendation/v60FoundationRatio.ts";

const candidateId = "candidate:ratio:v60-hot:foundation-16-v1";
const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

function recommendation(ratio) {
  return {
    templateName: "test",
    doseGrams: 15,
    waterGrams: 240,
    ratio,
    temperatureCelsius: 92,
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
    reasons: ["산미·향미 목표에 맞춰 1:16.5 비율을 적용했습니다."],
    confidence: "medium",
    confidenceReason: "test",
  };
}

function input({ brewer = "v60", drinkStyle = "hot", tasteGoal = "balanced" } = {}) {
  return {
    bean: {
      id: "ratio-test",
      name: "Ratio Test",
      originCountry: "ethiopia",
      originGroup: "east-africa",
      roastLevel: "light",
      process: "washed",
      createdAt: "2026-06-27T00:00:00Z",
      updatedAt: "2026-06-27T00:00:00Z",
    },
    grinder: {
      id: "ratio-grinder",
      model: "other",
      displayName: "Test",
      calibrationProfile: "test",
      calibrationLabel: "Test",
      calibrationStatus: "unknown",
      recommendationStatus: "reference",
      displayUnit: "step",
      adjustmentDirection: "unknown",
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
      defaultGrinderProfileId: "ratio-grinder",
      defaultTasteGoal: tasteGoal,
      updatedAt: "2026-06-27T00:00:00Z",
    },
    tasteGoal,
  };
}

test("HOT V60 ratio helper removes taste-goal offsets", () => {
  assert.equal(v60FoundationRatio, 16);
  for (const tasteGoal of ["sweet", "bright", "balanced", "body"]) {
    const result = applyV60FoundationRatio(
      recommendation(tasteGoal === "body" ? 15 : 16.5),
      input({ tasteGoal }),
    );
    assert.equal(result.ratio, 16, tasteGoal);
    assert.equal(
      result.reasons.some((reason) => reason.includes("목표에 맞춰 1:")),
      false,
    );
  }
});

test("ratio helper stays out of non-HOT-V60 paths", () => {
  const base = recommendation(16.5);
  assert.equal(
    applyV60FoundationRatio(base, input({ drinkStyle: "iced" })),
    base,
  );
  assert.equal(
    applyV60FoundationRatio(base, input({ brewer: "switch" })),
    base,
  );
});

test("candidate and dry-run scenarios preserve scope and values", () => {
  assert.equal(v60RatioCandidateRules.length, 1);
  const candidate = v60RatioCandidateRules[0];
  assert.equal(candidate.id, candidateId);
  assert.equal(candidate.status, "validated");
  assert.equal(candidate.confidenceScore, 0.72);
  assert.equal(candidate.supportingObservationIds.length, 2);
  assert.equal(candidate.limitingObservationIds.length, 4);
  assert.equal(candidate.contradictingObservationIds.length, 0);
  assert.equal(v60RatioSimulationScenarios.length, 8);

  const applicable = v60RatioSimulationScenarios.filter(
    (scenario) => scenario.expectedDecision === "apply",
  );
  assert.equal(applicable.length, 5);
  assert.ok(applicable.every((scenario) => scenario.expectedValues.ratio === 16));
  assert.equal(
    applicable.find((scenario) => scenario.id.endsWith("dose-20")).expectedValues
      .waterGrams,
    320,
  );
});

test("active rule and engine use the promoted ID", async () => {
  assert.equal(v60RatioRules.length, 1);
  assert.equal(v60RatioRules[0].id, v60FoundationRatioRuleId);
  assert.equal(v60RatioRules[0].status, "active");
  assert.equal(v60RatioRules[0].parameter, "ratio");

  const [engine, personalized, ruleRegistry, candidateRegistry, simulation] =
    await Promise.all([
      readProjectFile("lib/recommendation/engine.ts"),
      readProjectFile("lib/recommendation/personalized.ts"),
      readProjectFile("lib/recommendation/ruleRegistry.ts"),
      readProjectFile("lib/recommendation/candidateRuleRegistry.ts"),
      readProjectFile("lib/recommendation/candidateSimulation.ts"),
    ]);

  assert.match(engine, /v60FoundationRatioRuleId/);
  assert.match(engine, /v60FoundationRatio/);
  assert.match(personalized, /applyV60FoundationRatio/);
  assert.equal(engine.includes(candidateId), false);
  assert.match(ruleRegistry, /recommendationRuleRegistryVersion = "1\.5\.0"/);
  assert.match(candidateRegistry, /candidateRuleRegistryVersion = "1\.5\.0"/);
  assert.match(simulation, /v60-hot-paper-foundation-ratio-16-v1/);
});
