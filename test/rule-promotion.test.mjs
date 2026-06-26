import assert from "node:assert/strict";
import test from "node:test";
import { candidateRules } from "../data/recommendation/candidateRules.ts";
import { recommendationRules } from "../data/recommendation/rules.ts";
import { decideDialIn } from "../lib/recommendation/dialInDecision.ts";

const activeId = "grind.v60-hot-paper.dial-in.v1";

test("promoted rule is active", () => {
  const candidate = candidateRules[0];
  const active = recommendationRules.find((rule) => rule.id === activeId);
  assert.equal(candidate.status, "validated");
  assert.equal(candidate.promotion.ruleId, activeId);
  assert.equal(active.status, "active");
  assert.equal(active.evidenceLinks.length, 5);
});

test("direction decisions are stable", () => {
  const decide = (actualSeconds, tastingResult) =>
    decideDialIn({ actualSeconds, minimumSeconds: 150, maximumSeconds: 195, tastingResult });
  assert.equal(decide(125, "too-sour"), "finer");
  assert.equal(decide(220, "too-weak"), "coarser");
  assert.equal(decide(175, "bitter-astringent"), "coarser");
  assert.equal(decide(170, "good"), "hold");
});
