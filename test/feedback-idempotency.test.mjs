import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../lib/brew/sessionFeedback.ts", import.meta.url),
  "utf8",
);

test("feedback workflow events depend on changed diagnostic values", () => {
  assert.match(source, /hasTastingResult: hasDiagnosticChange/);
  assert.match(source, /hasAdjustmentOutcome: hasOutcomeChange/);
});

test("re-saving an unchanged good result does not create another recipe version", () => {
  assert.match(
    source,
    /input\.tastingResult === "good" && hasDiagnosticChange\s*\? promoteCurrentBestSession/,
  );
});

test("an adjustment outcome is finalized only when the outcome changed", () => {
  assert.match(
    source,
    /adjustment && input\.adjustmentOutcome && hasOutcomeChange/,
  );
});
