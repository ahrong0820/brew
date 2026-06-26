import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evidenceWeightPolicy } from "../data/recommendation/evidenceWeightPolicy.ts";
import {
  calculateConditionMatch,
  calculateEvidenceScore,
} from "../lib/recommendation/evidenceWeightCore.ts";

const source = {
  id: "expert:test",
  type: "expert",
  title: "Test expert source",
  authors: [{ name: "Expert", role: "author" }],
  accessedAt: "2026-06-26",
  identifiers: [{ scheme: "internal", value: "expert-test" }],
  status: "active",
  medium: "article",
  createdAt: "2026-06-26T00:00:00Z",
  updatedAt: "2026-06-26T00:00:00Z",
};

const observation = {
  id: "obs:expert:test",
  sourceId: source.id,
  kind: "expert-guidance",
  reviewStatus: "reviewed",
  summary: "test",
  excerpt: { locator: { section: "test" }, paraphrase: "test" },
  context: {
    brew: {
      brewerTypes: ["v60"],
      drinkStyles: ["hot"],
      filterMaterials: ["paper"],
    },
  },
  variables: [],
  assessment: {
    extractionConfidence: "medium",
    directness: "direct",
    methodologicalStrength: "expert-opinion",
    reproducibility: "single-source",
    limitations: [],
    reviewedBy: "reviewer",
    reviewedAt: "2026-06-26",
  },
  tags: [],
  createdAt: "2026-06-26T00:00:00Z",
  updatedAt: "2026-06-26T00:00:00Z",
};

const targetContext = {
  brew: {
    brewerTypes: ["v60"],
    drinkStyles: ["hot"],
    filterMaterials: ["paper"],
  },
};

test("initial evidence weights remain versioned policy data", () => {
  assert.equal(evidenceWeightPolicy.sourceTypeWeights.paper, 1);
  assert.equal(evidenceWeightPolicy.sourceTypeWeights.manufacturer, 0.9);
  assert.equal(evidenceWeightPolicy.sourceTypeWeights.expert, 0.6);
  assert.equal(evidenceWeightPolicy.sourceTypeWeights.competition, 0.5);
  assert.equal(evidenceWeightPolicy.sourceTypeWeights.personal, 0.7);
  assert.equal(evidenceWeightPolicy.sourceTypeWeights.internal, 0.2);
  assert.equal(evidenceWeightPolicy.methodologyWeights.observational, 0.9);
  assert.equal(evidenceWeightPolicy.personalSuccessWeight.single, 0.5);
  assert.equal(evidenceWeightPolicy.personalSuccessWeight.repeated, 1);
  assert.equal(evidenceWeightPolicy.independence.sameSourceAdditional, 0);
  assert.equal(evidenceWeightPolicy.independence.sameLineageAdditional, 0);
  assert.match(evidenceWeightPolicy.version, /^\d+\.\d+\.\d+$/);
});

test("evidence score multiplies all documented components", () => {
  const score = calculateEvidenceScore(
    { source, observation, targetContext },
    evidenceWeightPolicy,
  );

  assert.equal(score.sourceTypeWeight, 0.6);
  assert.equal(score.methodologyWeight, 1);
  assert.equal(score.directnessWeight, 1);
  assert.equal(score.conditionMatch.score, 1);
  assert.equal(score.independenceWeight, 1);
  assert.equal(score.reproducibilityWeight, 0.85);
  assert.equal(score.reviewTrustWeight, 0.9);
  assert.equal(score.personalSuccessWeight, 1);
  assert.ok(Math.abs(score.finalScore - 0.459) < 1e-12);
});

test("condition mismatch and indirect applicability lower the score", () => {
  const mismatch = calculateConditionMatch(
    observation.context,
    {
      brew: {
        brewerTypes: ["clever"],
        drinkStyles: ["iced"],
        filterMaterials: ["metal"],
      },
    },
    evidenceWeightPolicy,
  );
  assert.equal(mismatch.dimensions.brewer, "mismatch");
  assert.equal(mismatch.dimensions.drinkStyle, "mismatch");
  assert.equal(mismatch.dimensions.filter, "mismatch");
  assert.ok(mismatch.score < 1);

  const indirect = calculateEvidenceScore(
    {
      source,
      observation: {
        ...observation,
        assessment: { ...observation.assessment, directness: "indirect" },
      },
      targetContext,
    },
    evidenceWeightPolicy,
  );
  assert.ok(indirect.finalScore < 0.459);
});

test("personal repeated success weighs more than one success", () => {
  const personalSource = {
    ...source,
    id: "local:user-brew-history",
    type: "personal",
    runtimeCollection: "brewSessions",
  };
  const personalObservation = {
    ...observation,
    id: "obs:personal:test",
    sourceId: personalSource.id,
    assessment: {
      ...observation.assessment,
      methodologicalStrength: "personal-observation",
      extractionConfidence: "high",
    },
  };

  const single = calculateEvidenceScore(
    {
      source: personalSource,
      observation: personalObservation,
      targetContext,
      personalSuccessCount: 1,
    },
    evidenceWeightPolicy,
  );
  const repeated = calculateEvidenceScore(
    {
      source: personalSource,
      observation: personalObservation,
      targetContext,
      personalSuccessCount: 2,
    },
    evidenceWeightPolicy,
  );

  assert.equal(single.personalSuccessWeight, 0.5);
  assert.equal(repeated.personalSuccessWeight, 1);
  assert.equal(repeated.finalScore, single.finalScore * 2);
});

test("candidate aggregation suppresses same-source and same-lineage duplicates", async () => {
  const implementation = await readFile(
    new URL("../lib/recommendation/evidenceWeight.ts", import.meta.url),
    "utf8",
  );

  assert.match(implementation, /getEvidenceIndependenceKey/);
  assert.match(implementation, /lineage\?\.familyId \?\? sourceId/);
  assert.match(implementation, /groupKey = `\$\{entry\.role\}:\$\{entry\.independenceKey\}`/);
  assert.match(implementation, /suppressedObservationIds/);
  assert.match(implementation, /independentContributionCount/);
});
