import assert from "node:assert/strict";
import test from "node:test";

import { decideAdjustmentProgression } from "../lib/recommendation/adjustmentProgressionDecision.ts";

function trial(id, outcome) {
  return {
    id,
    sourceSessionId: `session-${id}`,
    variable: "grind",
    action: "finer",
    delta: -0.1,
    currentValue: "7.0",
    nextValue: "6.9",
    outcome,
    appliedAt: "2026-01-01T00:00:00.000Z",
    evaluatedAt: "2026-01-01T00:05:00.000Z",
  };
}

test("two improved finer trials switch to temperature", () => {
  const history = [trial("one", "improved"), trial("two", "improved")];
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous: history[1],
    history,
    brewPaceAssessment: "fast",
    tastingResult: "too-sour",
  });
  assert.equal(decision.action, "hotter");
  assert.match(decision.reason, /개선이 제한적/);
});

test("same then improved also counts as limited repeated grind", () => {
  const history = [trial("one", "same"), trial("two", "improved")];
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous: history[1],
    history,
    brewPaceAssessment: "fast",
    tastingResult: "not-sweet-enough",
  });
  assert.equal(decision.action, "hotter");
});

test("one improved grind trial may repeat once", () => {
  const history = [trial("one", "improved")];
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous: history[0],
    history,
    brewPaceAssessment: "fast",
    tastingResult: "too-sour",
  });
  assert.equal(decision.action, "finer");
});

test("worse result reverses the previous action", () => {
  const previous = trial("one", "worse");
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous,
    history: [previous],
    brewPaceAssessment: "fast",
    tastingResult: "too-sour",
  });
  assert.equal(decision.action, "coarser");
});
