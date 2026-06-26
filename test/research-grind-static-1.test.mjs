import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { researchGrindStatic1Sources } from "../data/evidence/researchGrindStatic1.ts";
import { researchGrindStatic1Observations } from "../data/evidence/researchGrindStatic1Observations.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("grinder static research source preserves preprint and rendered-page metadata", () => {
  assert.equal(researchGrindStatic1Sources.length, 1);
  const source = researchGrindStatic1Sources[0];

  assert.equal(source.id, "paper:arxiv:2312.03103:v3");
  assert.equal(source.type, "paper");
  assert.equal(source.peerReviewStatus, "preprint");
  assert.equal(source.publishedAt, "2023-12-19");
  assert.equal(source.accessedAt, "2026-06-26");
  assert.match(source.canonicalUrl, /^https:\/\/arxiv\.org\/abs\//);

  const notes = source.notes.join("\n");
  assert.match(notes, /9-11쪽 Figure 4-5/);
  assert.match(notes, /V60 또는 종이 필터 추출을 직접 시험하지 않았습니다/);
  assert.match(notes, /외삽이므로 Observation으로 등록하지 않습니다/);
  assert.match(notes, /프리프린트/);
});

test("grinder static observations retain roast and brewer limitations", () => {
  assert.equal(researchGrindStatic1Observations.length, 3);
  const [particle, darkEspresso, lightEspresso] =
    researchGrindStatic1Observations;

  for (const observation of researchGrindStatic1Observations) {
    assert.equal(observation.sourceId, researchGrindStatic1Sources[0].id);
    assert.equal(observation.kind, "controlled-comparison");
    assert.equal(observation.reviewStatus, "reviewed");
    assert.equal(observation.assessment.directness, "indirect");
    assert.equal(observation.assessment.methodologicalStrength, "controlled");
    assert.equal(observation.assessment.reproducibility, "single-source");
    assert.equal(observation.assessment.reviewedBy, "project-maintainer");
    assert.equal(observation.assessment.reviewedAt, "2026-06-26");
    assert.ok(observation.assessment.limitations.length >= 3);
  }

  assert.equal(particle.excerpt.locator.page, 9);
  assert.equal(particle.excerpt.locator.figure, "Figure 4");
  assert.deepEqual(particle.context.bean.roastLevels, ["dark"]);
  assert.equal(particle.outcome.variable, "representativeMicrons");
  assert.equal(particle.outcome.direction, "decrease");

  assert.equal(darkEspresso.excerpt.locator.page, 10);
  assert.equal(darkEspresso.excerpt.locator.figure, "Figure 5a");
  assert.deepEqual(darkEspresso.context.brew.brewerTypes, ["other"]);
  assert.equal(darkEspresso.outcome.variable, "beverageTdsPercent");
  assert.equal(darkEspresso.outcome.direction, "increase");
  assert.match(darkEspresso.outcome.value.value, /16%/);

  assert.equal(lightEspresso.excerpt.locator.page, 11);
  assert.deepEqual(lightEspresso.context.bean.roastLevels, ["light"]);
  assert.equal(lightEspresso.outcome.direction, "no-clear-change");
  assert.ok(lightEspresso.tags.includes("limiting-evidence"));
});

test("research batch is registered but not connected to candidate or active rules", async () => {
  const [registry, candidateRules, activeRules, evidenceTypes] = await Promise.all([
    readProjectFile("lib/evidence/registry.ts"),
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("lib/types/evidence.ts"),
  ]);

  assert.match(registry, /\.\.\.researchGrindStatic1Sources/);
  assert.match(registry, /\.\.\.researchGrindStatic1Observations/);
  assert.match(registry, /evidenceRegistryVersion = "\d+\.\d+\.\d+"/);

  for (const observation of researchGrindStatic1Observations) {
    assert.equal(candidateRules.includes(observation.id), false);
    assert.equal(activeRules.includes(observation.id), false);
  }

  assert.match(evidenceTypes, /"pregrindWaterMicrolitersPerGram"/);
  assert.match(evidenceTypes, /"grinderRetentionPercent"/);
  assert.match(evidenceTypes, /"electrostaticChargeToMass"/);
});
