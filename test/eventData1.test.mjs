import assert from "node:assert/strict";
import test from "node:test";

import { eventBatch1Sources } from "../data/evidence/eventBatch1.ts";
import { eventBatch1Observations } from "../data/evidence/eventBatch1Observations.ts";

test("event data batch is complete", () => {
  assert.equal(eventBatch1Sources.length, 2);
  assert.equal(eventBatch1Observations.length, 2);
});
