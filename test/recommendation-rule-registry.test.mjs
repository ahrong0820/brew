import assert from "node:assert/strict";
import test from "node:test";

import { recommendationRules } from "../data/recommendation/rules.ts";

test("recommendation rule ids are unique and versioned", () => {
  const ids = recommendationRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(
    recommendationRules.every(
      (rule) => Number.isInteger(rule.version) && rule.version >= 1,
    ),
  );
});

test("registry contains baseline, foundation and adjustment rules", () => {
  const ids = new Set(recommendationRules.map((rule) => rule.id));
  assert.ok(ids.has("dose.user-default.normalized.v1"));
  assert.ok(ids.has("grind.holzklotz-e80.v1"));
  assert.ok(ids.has("personalization.profile-offset.v1"));
  assert.ok(ids.has("pour.v60-hot-paper.foundation.v1"));
  assert.ok(ids.has("time.v60-hot-paper.foundation.v1"));
  assert.ok(ids.has("grind.v60-hot-paper.dial-in.v1"));
});

test("promoted HOT V60 foundation rules retain independent evidence", () => {
  const pour = recommendationRules.find(
    (candidate) => candidate.id === "pour.v60-hot-paper.foundation.v1",
  );
  const time = recommendationRules.find(
    (candidate) => candidate.id === "time.v60-hot-paper.foundation.v1",
  );

  assert.equal(pour.status, "active");
  assert.equal(pour.parameter, "pour");
  assert.equal(pour.evidenceLinks.length, 2);
  assert.equal(new Set(pour.evidenceLinks.map((link) => link.sourceId)).size, 2);
  assert.equal(time.status, "active");
  assert.equal(time.parameter, "time");
  assert.equal(time.evidenceLinks.length, 2);
  assert.equal(new Set(time.evidenceLinks.map((link) => link.sourceId)).size, 2);
});

test("promoted V60 adjustment rule retains support and limits", () => {
  const rule = recommendationRules.find(
    (candidate) => candidate.id === "grind.v60-hot-paper.dial-in.v1",
  );
  assert.equal(rule.status, "active");
  assert.equal(rule.implementationKey, "v60-hot-paper-grind-direction");
  assert.equal(rule.evidenceLinks.length, 5);
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "supports").length,
    3,
  );
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "limits").length,
    2,
  );
});
