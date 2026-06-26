import assert from "node:assert/strict";
import test from "node:test";

import { evidenceObservations } from "../data/evidence/observations.ts";
import { evidenceSources } from "../data/evidence/sources.ts";
import { recommendationRules } from "../data/recommendation/rules.ts";

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

test("registry covers every rule id the engine can emit", () => {
  const actualIds = new Set(recommendationRules.map((rule) => rule.id));
  assert.deepEqual(actualIds, expectedRuleIds);
});

test("rule ids are unique and versions are positive integers", () => {
  const ids = recommendationRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(
    recommendationRules.every(
      (rule) => Number.isInteger(rule.version) && rule.version >= 1,
    ),
  );
});

test("all rule evidence references resolve to registered sources and observations", () => {
  const sourceById = new Map(
    evidenceSources.map((source) => [source.id, source]),
  );
  const observationById = new Map(
    evidenceObservations.map((observation) => [observation.id, observation]),
  );

  for (const rule of recommendationRules) {
    for (const link of rule.evidenceLinks) {
      assert.ok(sourceById.has(link.sourceId), `${rule.id}: ${link.sourceId}`);

      if (!link.observationId) {
        continue;
      }

      const observation = observationById.get(link.observationId);
      assert.ok(observation, `${rule.id}: ${link.observationId}`);
      assert.equal(observation.sourceId, link.sourceId);

      if (
        rule.status === "active" &&
        (link.role === "supports" || link.role === "calibrates")
      ) {
        assert.equal(observation.reviewStatus, "reviewed");
      }
    }
  }
});

test("canonical ratio rule metadata is stored in the registry", () => {
  const rule = recommendationRules.find(
    (candidate) => candidate.id === "ratio.taste-goal.v1",
  );

  assert.equal(rule.version, 1);
  assert.equal(rule.parameter, "ratio");
  assert.equal(rule.description, "맛 목표별 초기 추출 비율 적용");
  assert.equal(
    rule.evidenceLinks[0].observationId,
    "obs:internal:initial-rule-set:baseline-v1",
  );
});

test("E80 rule includes manufacturer calibration evidence", () => {
  const rule = recommendationRules.find(
    (candidate) => candidate.id === "grind.holzklotz-e80.v1",
  );

  assert.ok(
    rule.evidenceLinks.some(
      (link) =>
        link.role === "calibrates" &&
        link.observationId ===
          "obs:manufacturer:holzklotz-e80:step-micron-table-v1",
    ),
  );
});
