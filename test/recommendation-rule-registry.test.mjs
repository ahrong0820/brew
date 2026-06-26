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

test("registry contains baseline and promoted rules", () => {
  const ids = new Set(recommendationRules.map((rule) => rule.id));
  assert.ok(ids.has("dose.user-default.normalized.v1"));
  assert.ok(ids.has("grind.holzklotz-e80.v1"));
  assert.ok(ids.has("personalization.profile-offset.v1"));
  assert.ok(ids.has("grind.v60-hot-paper.dial-in.v1"));
});

test("promoted V60 rule retains evidence boundaries", () => {
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
