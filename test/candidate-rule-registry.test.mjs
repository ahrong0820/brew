import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { candidateRules } from "../data/recommendation/candidateRules.ts";
import { v60RatioCandidateRules } from "../data/recommendation/v60RatioCandidateRules.ts";
import { v60TemperatureCandidateRules } from "../data/recommendation/v60TemperatureCandidateRules.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const allCandidates = [
  ...candidateRules,
  ...v60TemperatureCandidateRules,
  ...v60RatioCandidateRules,
];

test("validated candidates record their active rule promotions", async () => {
  assert.equal(allCandidates.length, 6);
  assert.ok(allCandidates.every((candidate) => candidate.status === "validated"));
  assert.ok(allCandidates.every((candidate) => candidate.audience === "global"));
  assert.ok(allCandidates.every((candidate) => candidate.reviewedBy === "project-maintainer"));

  const [baseRules, temperatureRules, ratioRules] = await Promise.all([
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("data/recommendation/v60TemperatureRules.ts"),
    readProjectFile("data/recommendation/v60RatioRules.ts"),
  ]);
  const activeRules = `${baseRules}\n${temperatureRules}\n${ratioRules}`;
  for (const candidate of allCandidates) {
    assert.ok(candidate.promotion);
    assert.equal(candidate.promotion.ruleVersion, 1);
    assert.equal(activeRules.includes(candidate.id), false);
    assert.equal(activeRules.includes(candidate.promotion.ruleId), true);
  }

  const initialCandidates = allCandidates.filter(
    (candidate) => candidate.validationPlan.targetLayer === "initial-recommendation",
  );
  assert.deepEqual(
    initialCandidates.map((candidate) => candidate.parameter),
    ["pour", "time", "grind", "temperature", "ratio"],
  );

  const ratioCandidate = allCandidates.find((candidate) =>
    candidate.id.includes("ratio:v60-hot:foundation-16"),
  );
  assert.ok(ratioCandidate);
  assert.equal(ratioCandidate.confidenceScore, 0.72);
  assert.equal(ratioCandidate.promotion.ruleRegistryVersion, "1.5.0");
});

test("candidate evidence stays unique and resolvable", async () => {
  const observations = [
    await readProjectFile("data/evidence/advisorNotesA.ts"),
    await readProjectFile("data/evidence/advisorNotesScottRao.ts"),
    await readProjectFile("data/evidence/v60FoundationObservations1.ts"),
    await readProjectFile("data/evidence/equipmentNotes1.ts"),
    await readProjectFile("data/evidence/equipmentNotes2.ts"),
    await readProjectFile("data/evidence/equipmentNotes3.ts"),
    await readProjectFile("data/evidence/researchBatch1Observations.ts"),
    await readProjectFile("data/evidence/standardsBrewing1Observations.ts"),
  ].join("\n");

  for (const candidate of allCandidates) {
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
  assert.match(registry, /candidateRuleRegistryVersion = "1\.5\.0"/);
  assert.match(registry, /v60RatioCandidateRules/);
  assert.match(registry, /groupCandidateEvidenceBySource/);
  assert.match(registry, /personal-rule-without-personal-evidence/);
  assert.match(registry, /missing-validation-plan/);
  assert.match(registry, /validation-plan-parameter-mismatch/);
  assert.match(registry, /invalid-promotion/);
});
