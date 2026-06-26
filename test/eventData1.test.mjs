import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { eventBatch1Sources } from "../data/evidence/eventBatch1.ts";

test("event source batch is complete", () => {
  assert.equal(eventBatch1Sources.length, 2);
  assert.ok(eventBatch1Sources.every((source) => source.canonicalUrl));
});

test("event observation module includes framework and result records", async () => {
  const source = await readFile(
    new URL("../data/evidence/eventBatch1Observations.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /obs:event-batch-1:framework/);
  assert.match(source, /eventBatch1B/);
});
