import assert from "node:assert/strict";
import test from "node:test";

import { recommendationRules } from "../data/recommendation/rules.ts";
import { v60RatioRules } from "../data/recommendation/v60RatioRules.ts";
import { v60ReferenceGrindRules } from "../data/recommendation/v60ReferenceGrindRules.ts";
import { v60TemperatureRules } from "../data/recommendation/v60TemperatureRules.ts";

const allRules = [
  ...recommendationRules,
  ...v60TemperatureRules,
  ...v60RatioRules,
  ...v60ReferenceGrindRules,
];

test("recommendation rule ids are unique and versioned", () => {
  const ids = allRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(
    allRules.every(
      (rule) => Number.isInteger(rule.version) && rule.version >= 1,
    ),
  );
});

test("registry contains baseline, foundation and adjustment rules", () => {
  const ids = new Set(allRules.map((rule) => rule.id));
  assert.ok(ids.has("dose.user-default.normalized.v1"));
  assert.ok(ids.has("grind.holzklotz-e80.v1"));
  assert.ok(ids.has("personalization.profile-offset.v1"));
  assert.ok(ids.has("grind.1zpresso-k-ultra.official-zero.v1"));
  assert.ok(ids.has("temperature.v60-hot-paper.roast-only.v1"));
  assert.ok(ids.has("ratio.v60-hot-paper.foundation-16.v1"));
  assert.ok(ids.has("grind.v60-hot-paper.reference-start-no-bean-offsets.v1"));
  assert.ok(ids.has("pour.v60-hot-paper.foundation.v1"));
  assert.ok(ids.has("time.v60-hot-paper.foundation.v1"));
  assert.ok(ids.has("grind.v60-hot-paper.dial-in.v1"));
});

test("HOT V60 ratio rule preserves support, context and limits", () => {
  const rule = allRules.find(
    (candidate) => candidate.id === "ratio.v60-hot-paper.foundation-16.v1",
  );
  assert.ok(rule);
  assert.equal(rule.status, "active");
  assert.equal(rule.parameter, "ratio");
  assert.equal(rule.implementationKey, "v60-hot-paper-foundation-ratio");
  assert.equal(rule.evidenceLinks.length, 7);
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "supports").length,
    2,
  );
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "limits").length,
    3,
  );
  assert.ok(
    rule.evidenceLinks.some(
      (link) =>
        link.observationId === "obs:expert-data-1:v60-ratio-range" &&
        link.applicability === "direct",
    ),
  );
  assert.ok(
    rule.evidenceLinks.some(
      (link) =>
        link.observationId ===
          "obs:research-batch-1:brew-ratio-coupled-control" &&
        link.role === "limits",
    ),
  );
});

test("HOT V60 roast-only temperature rule preserves support and limits", () => {
  const rule = allRules.find(
    (candidate) =>
      candidate.id === "temperature.v60-hot-paper.roast-only.v1",
  );
  assert.ok(rule);
  assert.equal(rule.status, "active");
  assert.equal(rule.parameter, "temperature");
  assert.equal(rule.implementationKey, "v60-hot-paper-roast-only-temperature");
  assert.equal(rule.evidenceLinks.length, 5);
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "supports").length,
    2,
  );
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "limits").length,
    1,
  );
});

test("K-Ultra official range rule retains chart and calibration evidence", () => {
  const rule = allRules.find(
    (candidate) =>
      candidate.id === "grind.1zpresso-k-ultra.official-zero.v1",
  );
  assert.equal(rule.status, "active");
  assert.equal(rule.parameter, "grind");
  assert.equal(rule.implementationKey, "k-ultra-official-zero-range");
  assert.equal(rule.evidenceLinks.length, 3);
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "supports").length,
    1,
  );
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "calibrates").length,
    2,
  );
});

test("HOT V60 reference grind rule removes unsupported bean offsets", () => {
  const rule = allRules.find(
    (candidate) =>
      candidate.id ===
      "grind.v60-hot-paper.reference-start-no-bean-offsets.v1",
  );
  assert.ok(rule);
  assert.equal(rule.status, "active");
  assert.equal(rule.parameter, "grind");
  assert.equal(rule.implementationKey, "v60-hot-paper-reference-grind");
  assert.equal(rule.evidenceLinks.length, 4);
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "context").length,
    1,
  );
  assert.equal(
    rule.evidenceLinks.filter((link) => link.role === "limits").length,
    3,
  );
});

test("promoted HOT V60 foundation rules retain independent evidence", () => {
  const pour = allRules.find(
    (candidate) => candidate.id === "pour.v60-hot-paper.foundation.v1",
  );
  const time = allRules.find(
    (candidate) => candidate.id === "time.v60-hot-paper.foundation.v1",
  );
  assert.equal(pour.status, "active");
  assert.equal(pour.evidenceLinks.length, 2);
  assert.equal(time.status, "active");
  assert.equal(time.evidenceLinks.length, 2);
});

test("promoted V60 adjustment rule retains support and limits", () => {
  const rule = allRules.find(
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
