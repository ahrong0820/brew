import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { researchPressureFlow1Sources } from "../data/evidence/researchPressureFlow1.ts";
import { researchPressureFlow1Observations } from "../data/evidence/researchPressureFlow1Observations.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("pressure-flow source preserves v2, preprint, and rendered-page metadata", () => {
  assert.equal(researchPressureFlow1Sources.length, 1);
  const source = researchPressureFlow1Sources[0];

  assert.equal(source.id, "paper:arxiv:2512.21528:v2");
  assert.equal(source.type, "paper");
  assert.equal(source.peerReviewStatus, "preprint");
  assert.equal(source.publishedAt, "2026-05-09");
  assert.equal(source.accessedAt, "2026-06-26");
  assert.match(source.canonicalUrl, /^https:\/\/arxiv\.org\/abs\//);

  const notes = source.notes.join("\n");
  assert.match(notes, /PDF 8쪽 Figure 5-6/);
  assert.match(notes, /PDF 9쪽 Figure 7/);
  assert.match(notes, /18\.50 g/);
  assert.match(notes, /약 120초/);
  assert.match(notes, /V60·종이 필터·중력식 추출로 직접 일반화하지 않습니다/);
  assert.match(notes, /프리프린트/);
});

test("pressure-flow observations preserve nonlinear flow and solute timing limits", () => {
  assert.equal(researchPressureFlow1Observations.length, 2);
  const [pressureFlow, soluteTiming] = researchPressureFlow1Observations;

  for (const observation of researchPressureFlow1Observations) {
    assert.equal(observation.sourceId, researchPressureFlow1Sources[0].id);
    assert.equal(observation.reviewStatus, "reviewed");
    assert.equal(observation.assessment.directness, "indirect");
    assert.equal(observation.assessment.reproducibility, "single-source");
    assert.equal(observation.assessment.reviewedBy, "project-maintainer");
    assert.equal(observation.assessment.reviewedAt, "2026-06-26");
    assert.ok(observation.tags.includes("espresso"));
    assert.ok(observation.tags.includes("indirect-for-v60"));
    assert.ok(observation.assessment.limitations.length >= 4);
  }

  assert.equal(pressureFlow.kind, "controlled-comparison");
  assert.equal(pressureFlow.excerpt.locator.page, 8);
  assert.equal(pressureFlow.excerpt.locator.figure, "Figures 5-6");
  assert.equal(pressureFlow.outcome.variable, "flowRateGramsPerSecond");
  assert.equal(pressureFlow.outcome.direction, "optimum");
  assert.ok(
    pressureFlow.variables.some(
      (variable) =>
        variable.name === "brewPressureBar" && variable.role === "intervention",
    ),
  );

  assert.equal(soluteTiming.kind, "measured-association");
  assert.equal(soluteTiming.excerpt.locator.page, 9);
  assert.equal(soluteTiming.excerpt.locator.figure, "Figure 7");
  assert.equal(soluteTiming.outcome.variable, "beverageTdsPercent");
  assert.equal(soluteTiming.outcome.direction, "decrease");
  assert.match(soluteTiming.summary, /약 30초 부근에서 최대/);
});

test("pressure-flow batch is registered without changing candidate or active rules", async () => {
  const [registry, candidateRules, activeRules, evidenceTypes] = await Promise.all([
    readProjectFile("lib/evidence/registry.ts"),
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("lib/types/evidence.ts"),
  ]);

  assert.match(registry, /\.\.\.researchPressureFlow1Sources/);
  assert.match(registry, /\.\.\.researchPressureFlow1Observations/);
  assert.match(registry, /evidenceRegistryVersion = "\d+\.\d+\.\d+"/);
  assert.match(evidenceTypes, /"brewPressureBar"/);

  for (const observation of researchPressureFlow1Observations) {
    assert.equal(candidateRules.includes(observation.id), false);
    assert.equal(activeRules.includes(observation.id), false);
  }
});
