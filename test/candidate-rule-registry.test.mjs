import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { candidateRules } from "../data/recommendation/candidateRules.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("candidate rules remain separate from active recommendation rules", async () => {
  assert.equal(candidateRules.length, 1);

  const candidate = candidateRules[0];
  assert.equal(candidate.status, "reviewed");
  assert.equal(candidate.audience, "global");
  assert.equal(candidate.parameter, "grind");
  assert.equal(candidate.scope.brew.brewerTypes[0], "v60");
  assert.equal(candidate.scope.brew.drinkStyles[0], "hot");
  assert.equal(candidate.scope.brew.filterMaterials[0], "paper");
  assert.ok(candidate.confidenceScore >= 0 && candidate.confidenceScore <= 1);
  assert.equal(candidate.reviewedBy, "project-maintainer");
  assert.equal(candidate.reviewedAt, "2026-06-26");
  assert.equal(candidate.promotion, undefined);
  assert.equal(candidate.validationPlan.targetLayer, "post-brew-adjustment");
  assert.deepEqual(candidate.validationPlan.changedParameters, ["grind"]);

  const activeRules = await readProjectFile("data/recommendation/rules.ts");
  assert.equal(activeRules.includes(candidate.id), false);
});

test("candidate evidence separates support, limits and contradictions", async () => {
  const candidate = candidateRules[0];
  const allIds = [
    ...candidate.supportingObservationIds,
    ...candidate.limitingObservationIds,
    ...candidate.contradictingObservationIds,
  ];

  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(candidate.supportingObservationIds.length, 3);
  assert.equal(candidate.limitingObservationIds.length, 2);
  assert.equal(candidate.contradictingObservationIds.length, 0);

  const observations = [
    await readProjectFile("data/evidence/advisorNotesA.ts"),
    await readProjectFile("data/evidence/advisorNotesScottRao.ts"),
  ].join("\n");

  for (const observationId of allIds) {
    assert.ok(observations.includes(observationId), observationId);
  }
});

test("candidate registry groups repeated observations by source", async () => {
  const [types, registry] = await Promise.all([
    readProjectFile("lib/types/candidateRule.ts"),
    readProjectFile("lib/recommendation/candidateRuleRegistry.ts"),
  ]);

  assert.match(types, /audience: CandidateRuleAudience/);
  assert.match(types, /supportingObservationIds/);
  assert.match(types, /limitingObservationIds/);
  assert.match(types, /contradictingObservationIds/);
  assert.match(types, /validationPlan\?: CandidateRuleValidationPlan/);
  assert.match(types, /promotion\?: CandidateRulePromotion/);

  assert.match(registry, /groupCandidateEvidenceBySource/);
  assert.match(registry, /groups\.get\(observation\.sourceId\)/);
  assert.match(registry, /independentSourceCount: groups\.length/);
  assert.match(registry, /personal-rule-without-personal-evidence/);
  assert.match(registry, /missing-validation-plan/);
  assert.match(registry, /validation-plan-parameter-mismatch/);
  assert.match(registry, /candidateRuleRegistryVersion = "1\.1\.0"/);
});
