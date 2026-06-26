import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { researchUnevenExtraction1Sources } from "../data/evidence/researchUnevenExtraction1.ts";
import { researchUnevenExtraction1Observations } from "../data/evidence/researchUnevenExtraction1Observations.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("uneven extraction source preserves publication and rendered-page metadata", () => {
  assert.equal(researchUnevenExtraction1Sources.length, 1);
  const source = researchUnevenExtraction1Sources[0];

  assert.equal(source.id, "paper:physics-of-fluids:2023:5.0138998");
  assert.equal(source.type, "paper");
  assert.equal(source.peerReviewStatus, "peer-reviewed");
  assert.equal(source.publishedAt, "2023-04-10");
  assert.equal(source.accessedAt, "2026-06-26");
  assert.equal(source.journal, "Physics of Fluids");
  assert.equal(source.canonicalUrl, "https://doi.org/10.1063/5.0138998");
  assert.ok(
    source.identifiers.some(
      (identifier) =>
        identifier.scheme === "url" &&
        identifier.value === "https://arxiv.org/abs/2206.12373v2",
    ),
  );

  const notes = source.notes.join("\n");
  assert.match(notes, /PDF 1쪽의 연구 범위, 4쪽 Figure 5-7, 5쪽/);
  assert.match(notes, /새로운 통제 추출 실험은 아닙니다/);
  assert.match(notes, /V60·종이 필터·중력식 유속을 직접 측정하지 않았습니다/);
  assert.match(notes, /비물리적 커피 밀도 매개변수/);
});

test("uneven extraction observations preserve model result and limiting evidence", () => {
  assert.equal(researchUnevenExtraction1Observations.length, 2);
  const [turnover, physicalDensityLimit] =
    researchUnevenExtraction1Observations;

  for (const observation of researchUnevenExtraction1Observations) {
    assert.equal(
      observation.sourceId,
      researchUnevenExtraction1Sources[0].id,
    );
    assert.equal(observation.kind, "measured-association");
    assert.equal(observation.reviewStatus, "reviewed");
    assert.equal(observation.assessment.directness, "indirect");
    assert.equal(observation.assessment.methodologicalStrength, "unknown");
    assert.equal(observation.assessment.reproducibility, "single-source");
    assert.equal(observation.assessment.reviewedBy, "project-maintainer");
    assert.equal(observation.assessment.reviewedAt, "2026-06-26");
    assert.ok(observation.tags.includes("mathematical-model"));
    assert.ok(observation.assessment.limitations.length >= 3);
  }

  assert.equal(turnover.excerpt.locator.page, 4);
  assert.equal(turnover.excerpt.locator.figure, "Figures 5-7");
  assert.equal(turnover.outcome.variable, "extractionYieldPercent");
  assert.equal(turnover.outcome.direction, "optimum");
  assert.match(turnover.summary, /중간 분쇄도에서 추출 수율이 정점/);

  assert.equal(physicalDensityLimit.excerpt.locator.page, 5);
  assert.equal(
    physicalDensityLimit.outcome.variable,
    "extractionYieldPercent",
  );
  assert.equal(physicalDensityLimit.outcome.direction, "no-clear-change");
  assert.ok(physicalDensityLimit.tags.includes("limiting-evidence"));
  assert.match(physicalDensityLimit.summary, /두 배인 비물리적 밀도/);
});

test("uneven extraction batch is registered without changing recommendation rules", async () => {
  const [registry, candidateRules, activeRules] = await Promise.all([
    readProjectFile("lib/evidence/registry.ts"),
    readProjectFile("data/recommendation/candidateRules.ts"),
    readProjectFile("data/recommendation/rules.ts"),
  ]);

  assert.match(registry, /\.\.\.researchUnevenExtraction1Sources/);
  assert.match(registry, /\.\.\.researchUnevenExtraction1Observations/);
  assert.match(registry, /evidenceRegistryVersion = "\d+\.\d+\.\d+"/);

  for (const observation of researchUnevenExtraction1Observations) {
    assert.equal(candidateRules.includes(observation.id), false);
    assert.equal(activeRules.includes(observation.id), false);
  }
});
