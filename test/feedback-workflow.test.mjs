import assert from "node:assert/strict";
import test from "node:test";

import {
  feedbackEventKind,
  shouldPromptForOutcome,
  shouldSyncRecipe,
} from "../lib/brew/feedbackWorkflow.ts";

test("taste feedback opens the normal post-brew workflow", () => {
  assert.equal(
    feedbackEventKind({
      hasTastingResult: true,
      hasAdjustmentOutcome: false,
    }),
    "brew-feedback",
  );
});

test("adjustment outcome restarts recommendation without reopening comparison", () => {
  const kind = feedbackEventKind({
    hasTastingResult: false,
    hasAdjustmentOutcome: true,
  });

  assert.equal(kind, "adjustment-outcome");
  assert.equal(shouldSyncRecipe(kind), false);
  assert.equal(
    shouldPromptForOutcome({
      kind,
      hasAppliedAdjustment: true,
      hasAdjustmentOutcome: true,
    }),
    false,
  );
});

test("outcome takes precedence when an update carries existing taste data", () => {
  assert.equal(
    feedbackEventKind({
      hasTastingResult: true,
      hasAdjustmentOutcome: true,
    }),
    "adjustment-outcome",
  );
});

test("only a new brew result with an unevaluated adjustment requests comparison", () => {
  const kind = "brew-feedback";

  assert.equal(shouldSyncRecipe(kind), true);
  assert.equal(
    shouldPromptForOutcome({
      kind,
      hasAppliedAdjustment: true,
      hasAdjustmentOutcome: false,
    }),
    true,
  );
  assert.equal(
    shouldPromptForOutcome({
      kind,
      hasAppliedAdjustment: false,
      hasAdjustmentOutcome: false,
    }),
    false,
  );
});

test("timer-only updates do not emit a feedback workflow event", () => {
  assert.equal(
    feedbackEventKind({
      hasTastingResult: false,
      hasAdjustmentOutcome: false,
    }),
    null,
  );
});
