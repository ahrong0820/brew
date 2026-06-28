import assert from "node:assert/strict";
import test from "node:test";

import { decideAdjustmentProgression } from "../lib/recommendation/adjustmentProgressionDecision.ts";

function trial({
  id,
  action = "finer",
  variable = "grind",
  outcome = "improved",
}) {
  return {
    id,
    sourceSessionId: `session-${id}`,
    variable,
    action,
    delta: action === "finer" ? -0.1 : 0.1,
    currentValue: "7.0",
    nextValue: "6.9",
    outcome,
    appliedAt: "2026-06-28T00:00:00Z",
    evaluatedAt: "2026-06-28T00:10:00Z",
  };
}

test("one improved grind adjustment can repeat in the same direction", () => {
  const previous = trial({ id: "one" });
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous,
    history: [previous],
    brewPaceAssessment: "fast",
    tastingResult: "too-sour",
  });

  assert.equal(decision.action, "finer");
  assert.match(decision.reason, /같은 방향/);
});

test("two improved grind adjustments switch to temperature for extraction taste", () => {
  const first = trial({ id: "one" });
  const second = trial({ id: "two" });
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous: second,
    history: [first, second],
    brewPaceAssessment: "fast",
    tastingResult: "too-sour",
  });

  assert.equal(decision.action, "hotter");
  assert.match(decision.reason, /두 번 연속/);
  assert.match(decision.reason, /온도 또는 비율/);
});

test("two improved grind adjustments switch to ratio for strength taste", () => {
  const first = trial({ id: "one" });
  const second = trial({ id: "two" });
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous: second,
    history: [first, second],
    brewPaceAssessment: "fast",
    tastingResult: "too-weak",
  });

  assert.equal(decision.action, "less-water");
});

test("a worse result still reverses the immediately preceding adjustment", () => {
  const previous = trial({ id: "worse", outcome: "worse" });
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous,
    history: [previous],
    brewPaceAssessment: "fast",
    tastingResult: "too-sour",
  });

  assert.equal(decision.action, "coarser");
  assert.match(decision.reason, /되돌립니다/);
});

test("no difference switches away from grind", () => {
  const previous = trial({ id: "same", outcome: "same" });
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous,
    history: [previous],
    brewPaceAssessment: "fast",
    tastingResult: "not-sweet-enough",
  });

  assert.equal(decision.action, "hotter");
  assert.match(decision.reason, /다른 한 변수/);
});

test("a new diagnostic variable is not overridden by prior grind success", () => {
  const previous = trial({ id: "grind" });
  const decision = decideAdjustmentProgression({
    baseAction: "more-water",
    previous,
    history: [previous],
    brewPaceAssessment: "in-range",
    tastingResult: "too-strong",
  });

  assert.equal(decision.action, "more-water");
  assert.equal(decision.reason, undefined);
});
