import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("outcome workflow stores and waits for comparison result", async () => {
  const feedback = await read("lib/brew/sessionFeedback.ts");
  const validated = await read("lib/recommendation/validatedAdjustment.ts");
  const tracker = await read("app/AdjustmentOutcomeTracker.tsx");

  assert.match(feedback, /adjustmentOutcome\?: BrewAdjustmentOutcome/);
  assert.match(feedback, /finalizeAdjustmentTrial/);
  assert.match(feedback, /pendingAdjustmentId/);
  assert.match(validated, /session\.appliedAdjustmentId && !session\.adjustmentOutcome/);
  assert.match(tracker, /AdjustmentOutcomeSelector/);
  assert.match(tracker, /saveBrewFeedback/);
});
