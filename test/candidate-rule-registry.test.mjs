import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { candidateRules } from "../data/recommendation/candidateRules.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("validated candidates record their active rule promotions", async () => {
  assert.equal(candidateRules.length, 3);
  assert.ok(candidateRules.every((candidate) => candidate.status === "validated"));
  assert.ok(candidateRules.every((candidate) => candidate.audience === "global"));
  assert.ok(candidateRules.every((candidate) => candidate.reviewedBy === "project-maintainer"));

  const activeRules = await readProjectFile("data/recommendation/rules.ts");
  for (const candidate of candidateRules) {
    assert.ok(candidate.promotion);
    assert.equal(candidate.promotion.ruleVersion, 1);
    assert.equal(activeRules.includes(candidate.id), false);
    assert.equal(activeRules.includes(candidate.promotion.ruleId), true);
  }

  const foundationCandidates = candidateRules.filter(
    (candidate) => candidate.validationPlan.targetLayer === "initial-recommendation",
  );
  assert.deepEqual(
    foundationCandidates.map((candidate) => candidate.parameter),
    ["pour", "time"],
  );
  assert.ok(
    foundationCandidates.every(
      (candidate) => candidate.promotion.ruleRegistryVersion === "1.2.0",
    ),
  );
});

test("candidate evidence stays unique within each role set", async () => {
  const observations = [
    await readProjectFile("data/evidence/advisorNotesA.ts"),
    await readProjectFile("data/evidence/advisorNotesScottRao.ts"),
    await readProjectFile("data/evidence/v60FoundationObservations1.ts"),
  ].join("\n");

  for (const candidate of candidateRules) {
    const allIds = [
      ...candidate.supportingObservationIds,
      ...candidate.limitingObservationIds,
      ...candidate.contradictingObservationIds,
    ];
    assert.equal(new Set(allIds).size, allIds.length, candidate.id);
    for (const observationId of allIds) {
      assert.ok(observations.includes(observationId), observationId);
    }
  }
});

test("candidate registry validates evidence, plans and promotion metadata", async () => {
  const [types, registry] = await Promise.all([
    readProjectFile("lib/types/candidateRule.ts"),
    readProjectFile("lib/recommendation/candidateRuleRegistry.ts"),
  ]);

  assert.match(types, /audience: CandidateRuleAudience/);
  assert.match(types, /validationPlan\?: CandidateRuleValidationPlan/);
  assert.match(types, /promotion\?: CandidateRulePromotion/);
  assert.match(registry, /candidateRuleRegistryVersion = "1\.2\.0"/);
  assert.match(registry, /groupCandidateEvidenceBySource/);
  assert.match(registry, /personal-rule-without-personal-evidence/);
  assert.match(registry, /missing-validation-plan/);
  assert.match(registry, /validation-plan-parameter-mismatch/);
  assert.match(registry, /invalid-promotion/);
});
