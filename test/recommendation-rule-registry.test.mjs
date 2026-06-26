import assert from "node:assert/strict";
import test from "node:test";

import { recommendationRules } from "../data/recommendation/rules.ts";
import {
  createAppliedRule,
  createAppliedRuleFromRegistry,
} from "../lib/recommendation/ruleEvidence.ts";
import {
  validateRecommendationRuleRegistry,
} from "../lib/recommendation/ruleRegistry.ts";

const registry = {
  version: "1.0.0",
  rules: recommendationRules,
};

const grinders = [
  "1zpresso-k-ultra",
  "holzklotz-e80",
  "baratza-encore",
  "other",
];
const brewers = ["v60", "clever", "switch", "other"];
const tasteGoals = ["sweet", "bright", "balanced", "body"];

const expectedRuleIds = new Set([
  "dose.user-default.normalized.v1",
  "ratio.taste-goal.v1",
  "water.dose-ratio.normalized.v1",
  "temperature.roast-process-taste.v1",
  ...grinders.map((model) => `grind.${model}.v1`),
  ...brewers.flatMap((brewer) =>
    tasteGoals.map((tasteGoal) => `pour.${brewer}.${tasteGoal}.v1`),
  ),
  ...brewers.map((brewer) => `time.${brewer}.v1`),
  "personalization.profile-offset.v1",
  "personalization.success-history.single.v1",
  "personalization.success-history.repeat.v1",
]);

test("current recommendation rules form a valid registry", () => {
  assert.deepEqual(validateRecommendationRuleRegistry(registry), []);
});

test("registry covers every rule id the engine can emit", () => {
  const actualIds = new Set(recommendationRules.map((rule) => rule.id));
  assert.deepEqual(actualIds, expectedRuleIds);
});

test("registered metadata is canonical", () => {
  const applied = createAppliedRule({
    id: "ratio.taste-goal.v1",
    parameter: "temperature",
    description: "compatibility placeholder",
  });

  assert.equal(applied.version, 1);
  assert.equal(applied.parameter, "ratio");
  assert.equal(applied.description, "맛 목표별 초기 추출 비율 적용");
  assert.equal(applied.evidence[0].sourceId, "internal:initial-rule-set:v1");
  assert.equal(
    applied.evidence[0].observationId,
    "obs:internal:initial-rule-set:baseline-v1",
  );
});

test("E80 rule includes manufacturer calibration evidence", () => {
  const applied = createAppliedRuleFromRegistry("grind.holzklotz-e80.v1");

  assert.equal(applied.version, 1);
  assert.ok(
    applied.evidence.some(
      (evidence) =>
        evidence.kind === "manufacturer" &&
        evidence.observationId ===
          "obs:manufacturer:holzklotz-e80:step-micron-table-v1",
    ),
  );
});
