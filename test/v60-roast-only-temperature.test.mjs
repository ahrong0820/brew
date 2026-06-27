import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createDefaultGrinderProfiles,
  createDefaultUserPreferences,
} from "../data/defaultCoffeeProfiles.ts";
import { v60TemperatureCandidateRules } from "../data/recommendation/v60TemperatureCandidateRules.ts";
import { v60TemperatureRules } from "../data/recommendation/v60TemperatureRules.ts";
import { assessCandidateReadiness } from "../lib/recommendation/candidateReadiness.ts";
import { createPersonalizedRecommendation } from "../lib/recommendation/personalized.ts";
import {
  v60RoastOnlyTemperature,
  v60RoastOnlyTemperatureRuleId,
} from "../lib/recommendation/v60RoastOnlyTemperature.ts";

const candidateId = "candidate:temperature:v60-hot:roast-only-v1";
const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

function recommendationInput({
  roastLevel = "light",
  process = "washed",
  tasteGoal = "balanced",
  brewer = "v60",
  drinkStyle = "hot",
  temperatureOffset = 0,
} = {}) {
  const timestamp = "2026-06-27T00:00:00Z";
  const grinder = createDefaultGrinderProfiles(timestamp)[0];
  const preferences = {
    ...createDefaultUserPreferences(timestamp),
    defaultBrewer: brewer,
    defaultDrinkStyle: drinkStyle,
    defaultTasteGoal: tasteGoal,
  };

  return {
    bean: {
      id: "bean-temperature-test",
      name: "Temperature Test",
      originCountry: "ethiopia",
      originGroup: "east-africa",
      roastLevel,
      process,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    grinder,
    preferences,
    tasteGoal,
    recommendationOffset:
      temperatureOffset === 0
        ? undefined
        : { temperature: temperatureOffset, ratio: 0, grind: 0 },
  };
}

test("candidate is promotion-ready with independent and empirical support", () => {
  assert.equal(v60TemperatureCandidateRules.length, 1);
  const candidate = v60TemperatureCandidateRules[0];
  assert.equal(candidate.id, candidateId);
  assert.equal(candidate.status, "validated");
  assert.equal(candidate.confidenceScore, 0.74);

  const assessment = assessCandidateReadiness(candidateId);
  assert.equal(assessment.stage, "promotion-ready");
  assert.equal(assessment.metrics.supportingObservationCount, 3);
  assert.equal(assessment.metrics.directOrPartialSupportingObservationCount, 3);
  assert.equal(assessment.metrics.empiricalSupportingObservationCount, 1);
  assert.equal(assessment.metrics.independentSupportFamilyCount, 3);
  assert.equal(assessment.metrics.limitingObservationCount, 1);
  assert.equal(assessment.metrics.contradictingObservationCount, 0);
  assert.equal(assessment.simulation.totalScenarios, 8);
  assert.equal(assessment.simulation.passedScenarios, 8);
  assert.equal(assessment.simulation.allPassed, true);
  assert.deepEqual(assessment.promotionBlockers, []);
});

test("roast baseline is stable across taste goals and process methods", () => {
  assert.equal(v60RoastOnlyTemperature("light"), 94);
  assert.equal(v60RoastOnlyTemperature("medium-light"), 92);
  assert.equal(v60RoastOnlyTemperature("medium"), 90);
  assert.equal(v60RoastOnlyTemperature("medium-dark"), 88);
  assert.equal(v60RoastOnlyTemperature("dark"), 85);
  assert.equal(v60RoastOnlyTemperature("unknown"), 91);

  const washedBright = createPersonalizedRecommendation(
    recommendationInput({ process: "washed", tasteGoal: "bright" }),
  );
  const naturalBody = createPersonalizedRecommendation(
    recommendationInput({ process: "natural", tasteGoal: "body" }),
  );
  const fermentedBright = createPersonalizedRecommendation(
    recommendationInput({ process: "fermented", tasteGoal: "bright" }),
  );

  assert.equal(washedBright.temperatureCelsius, 94);
  assert.equal(naturalBody.temperatureCelsius, 94);
  assert.equal(fermentedBright.temperatureCelsius, 94);
  assert.ok(
    naturalBody.reasons.some((reason) => reason.includes("별도 오프셋을 더하지 않았습니다")),
  );
});

test("personal temperature history remains additive after the initial rule", () => {
  const recommendation = createPersonalizedRecommendation(
    recommendationInput({
      roastLevel: "medium",
      process: "fermented",
      tasteGoal: "bright",
      temperatureOffset: 1,
    }),
  );

  assert.equal(recommendation.temperatureCelsius, 91);
  assert.ok(
    recommendation.reasons.some((reason) => reason.includes("개인 보정값")),
  );
});

test("non-HOT-V60 recommendations retain the generic temperature heuristic", () => {
  const switchRecommendation = createPersonalizedRecommendation(
    recommendationInput({
      roastLevel: "light",
      process: "natural",
      tasteGoal: "body",
      brewer: "switch",
    }),
  );
  const icedRecommendation = createPersonalizedRecommendation(
    recommendationInput({
      roastLevel: "light",
      process: "natural",
      tasteGoal: "body",
      drinkStyle: "iced",
    }),
  );

  assert.equal(switchRecommendation.temperatureCelsius, 92);
  assert.equal(icedRecommendation.temperatureCelsius, 92);
});

test("active rule and engine use the promoted id, never the candidate id", async () => {
  assert.equal(v60TemperatureRules.length, 1);
  const rule = v60TemperatureRules[0];
  assert.equal(rule.id, v60RoastOnlyTemperatureRuleId);
  assert.equal(rule.parameter, "temperature");
  assert.equal(rule.status, "active");

  const [engine, personalized, ruleRegistry, candidateRegistry] = await Promise.all([
    readProjectFile("lib/recommendation/engine.ts"),
    readProjectFile("lib/recommendation/personalized.ts"),
    readProjectFile("lib/recommendation/ruleRegistry.ts"),
    readProjectFile("lib/recommendation/candidateRuleRegistry.ts"),
  ]);

  assert.match(engine, /v60RoastOnlyTemperatureRuleId/);
  assert.match(personalized, /applyV60RoastOnlyTemperature/);
  assert.equal(engine.includes(candidateId), false);
  assert.match(ruleRegistry, /recommendationRuleRegistryVersion = "1\.4\.0"/);
  assert.match(candidateRegistry, /candidateRuleRegistryVersion = "1\.4\.0"/);
});
