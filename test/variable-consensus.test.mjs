import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  candidateVariablePlans,
  variableConsensusPolicy,
} from "../data/recommendation/variableConsensusPolicies.ts";
import {
  calculateConsensusConfidence,
  classifyVariableConsensus,
  combineIndependentEvidenceScores,
  summarizeEvidenceRole,
} from "../lib/recommendation/variableConsensusCore.ts";

function weightedEntry({
  observationId,
  role,
  finalScore,
  independenceKey,
}) {
  return {
    sourceId: `source:${independenceKey}`,
    observationId,
    sourceTypeWeight: 1,
    methodologyWeight: 1,
    directnessWeight: 1,
    conditionMatch: {
      score: 1,
      dimensions: {
        brewer: "match",
        drinkStyle: "match",
        roastLevel: "not-applicable",
        process: "not-applicable",
        doseRatio: "not-applicable",
        grinderBurr: "not-applicable",
        filter: "match",
        water: "not-applicable",
        tasteGoal: "not-applicable",
      },
    },
    independenceWeight: 1,
    reproducibilityWeight: 1,
    reviewTrustWeight: 1,
    personalSuccessWeight: 1,
    finalScore,
    role,
    independenceKey,
    suppressedObservationIds: [],
  };
}

test("independent evidence scores combine without simple averaging", () => {
  assert.ok(
    Math.abs(combineIndependentEvidenceScores([0.4, 0.5]) - 0.7) < 1e-12,
  );
  assert.equal(combineIndependentEvidenceScores([]), 0);
});

test("variable consensus distinguishes insufficient, aligned, conditional and conflicted", () => {
  const thresholds = variableConsensusPolicy.thresholds;
  const empty = summarizeEvidenceRole([]);
  const support = summarizeEvidenceRole([
    weightedEntry({
      observationId: "support:1",
      role: "supports",
      finalScore: 0.45,
      independenceKey: "a",
    }),
    weightedEntry({
      observationId: "support:2",
      role: "supports",
      finalScore: 0.4,
      independenceKey: "b",
    }),
  ]);

  assert.equal(
    classifyVariableConsensus(
      summarizeEvidenceRole([
        weightedEntry({
          observationId: "support:one",
          role: "supports",
          finalScore: 0.8,
          independenceKey: "a",
        }),
      ]),
      empty,
      empty,
      thresholds,
    ),
    "insufficient",
  );
  assert.equal(
    classifyVariableConsensus(support, empty, empty, thresholds),
    "aligned",
  );

  const limits = summarizeEvidenceRole([
    weightedEntry({
      observationId: "limit:1",
      role: "limits",
      finalScore: 0.3,
      independenceKey: "c",
    }),
  ]);
  assert.equal(
    classifyVariableConsensus(support, limits, empty, thresholds),
    "conditional",
  );

  const contradictions = summarizeEvidenceRole([
    weightedEntry({
      observationId: "contradict:1",
      role: "contradicts",
      finalScore: 0.55,
      independenceKey: "d",
    }),
  ]);
  assert.equal(
    classifyVariableConsensus(support, empty, contradictions, thresholds),
    "conflicted",
  );
});

test("limits and contradictions reduce consensus confidence", () => {
  const thresholds = variableConsensusPolicy.thresholds;
  const support = summarizeEvidenceRole([
    weightedEntry({
      observationId: "support:1",
      role: "supports",
      finalScore: 0.7,
      independenceKey: "a",
    }),
    weightedEntry({
      observationId: "support:2",
      role: "supports",
      finalScore: 0.5,
      independenceKey: "b",
    }),
  ]);
  const empty = summarizeEvidenceRole([]);
  const limits = summarizeEvidenceRole([
    weightedEntry({
      observationId: "limit:1",
      role: "limits",
      finalScore: 0.4,
      independenceKey: "c",
    }),
  ]);
  const contradictions = summarizeEvidenceRole([
    weightedEntry({
      observationId: "contradict:1",
      role: "contradicts",
      finalScore: 0.3,
      independenceKey: "d",
    }),
  ]);

  const aligned = calculateConsensusConfidence(
    support,
    empty,
    empty,
    thresholds,
  );
  const conditional = calculateConsensusConfidence(
    support,
    limits,
    empty,
    thresholds,
  );
  const conflicted = calculateConsensusConfidence(
    support,
    limits,
    contradictions,
    thresholds,
  );

  assert.ok(aligned > conditional);
  assert.ok(conditional > conflicted);
});

test("HOT V60 grind plan preserves adjustment order and rollback guards", () => {
  assert.equal(candidateVariablePlans.length, 1);
  const plan = candidateVariablePlans[0];
  assert.equal(plan.variable, "grind");
  assert.equal(plan.proposedDirection, "finer");
  assert.deepEqual(plan.controlVariables, ["ratio", "temperature"]);
  assert.ok(plan.adjustmentOrder.length >= 4);

  const targetTimeGuard = plan.guards.find(
    (guard) => guard.id === "guard:grind:v60-hot:target-time-upper-bound",
  );
  assert.equal(targetTimeGuard.response, "rollback");
  assert.equal(targetTimeGuard.adjustmentDirection, "coarser");
  assert.equal(targetTimeGuard.reference, "recipe.targetTimeMaxSeconds");

  const astringencyGuard = plan.guards.find(
    (guard) => guard.metric === "sensoryAstringency",
  );
  assert.equal(astringencyGuard.response, "rollback");
  assert.ok(astringencyGuard.evidenceObservationIds.length >= 1);
});

test("consensus assessment remains separate from active recommendation execution", async () => {
  const implementation = await readFile(
    new URL("../lib/recommendation/variableConsensus.ts", import.meta.url),
    "utf8",
  );
  const engine = await readFile(
    new URL("../lib/recommendation/baseEngine.ts", import.meta.url),
    "utf8",
  );

  assert.match(implementation, /assessCandidateVariableConsensus/);
  assert.match(implementation, /scoreCandidateRuleEvidence/);
  assert.match(implementation, /guard-evidence-outside-candidate/);
  assert.equal(engine.includes("assessCandidateVariableConsensus"), false);
});
