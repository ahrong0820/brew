import assert from "node:assert/strict";
import test from "node:test";

import { buildRecommendationTrace } from "../lib/recommendation/recommendationTrace.ts";
import { isCompatibleBrewSession } from "../lib/storage/brewSessionGuard.ts";

const recommendation = {
  templateName: "test",
  doseGrams: 15,
  waterGrams: 240,
  ratio: 16,
  temperatureCelsius: 92,
  targetTimeMinSeconds: 150,
  targetTimeMaxSeconds: 195,
  grinder: {
    displayValue: "7.0",
    displayRange: "6.8~7.2",
    commonDescription: "medium",
    calibrationLabel: "zero",
    isNumeric: true,
    note: "test",
  },
  steps: [],
  reasons: [],
  confidence: "medium",
  confidenceReason: "test",
  appliedRules: [
    {
      id: "ratio.taste-goal.v1",
      version: 1,
      parameter: "ratio",
      description: "ratio",
      evidence: [
        {
          kind: "heuristic",
          sourceId: "internal:initial-rule-set:v1",
          observationId: "obs:internal:initial-rule-set:baseline-v1",
          role: "context",
          applicability: "direct",
        },
      ],
    },
  ],
};

test("trace snapshot preserves rule versions and evidence references", () => {
  const trace = buildRecommendationTrace(
    recommendation,
    "2026-06-26T00:00:00Z",
    "1.0.0",
    "1.0.0",
    "1.0.0",
  );

  assert.equal(trace.appliedRules.length, 1);
  assert.equal(trace.appliedRules[0].ruleId, "ratio.taste-goal.v1");
  assert.equal(trace.appliedRules[0].ruleVersion, 1);
  assert.equal(
    trace.appliedRules[0].evidenceRefs[0].observationId,
    "obs:internal:initial-rule-set:baseline-v1",
  );
});

function sessionWithTrace(recommendationTrace) {
  return {
    id: "session-1",
    beanId: "bean-1",
    profileId: "profile-1",
    drinkStyle: "hot",
    tasteGoal: "balanced",
    recommendationConfidence: "medium",
    recipeSnapshot: {
      sourceTemplateId: "recommendation-hot-v60-balanced",
      sourceTemplateName: "test",
      brewerType: "v60",
      drink
Style: "hot",
      doseGrams: 15,
      waterGrams: 240,
      ratio: 16,
      temperatureCelsius: 92,
      grindLevel: 7,
      grinderDisplayValue: "7.0",
      totalTimeSeconds: 195,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 195,
      recommendationTrace,
      steps: [],
    },
    status: "trial",
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  };
}

test("legacy sessions without trace remain compatible", () => {
  const session = sessionWithTrace(undefined);
  assert.equal(isCompatibleBrewSession(session), true);
});

test("invalid trace is removed without discarding the session", () => {
  const session = sessionWithTrace({ appliedRules: "invalid" });
  assert.equal(isCompatibleBrewSession(session), true);
  assert.equal(session.recipeSnapshot.recommendationTrace, undefined);
});
