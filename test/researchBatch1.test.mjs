import assert from "node:assert/strict";
import test from "node:test";

import { researchBatch1Sources } from "../data/evidence/researchBatch1.ts";
import { researchBatch1Observations } from "../data/evidence/researchBatch1Observations.ts";

test("first research batch includes one reviewed paper source", () => {
  assert.equal(researchBatch1Sources.length, 1);
  assert.equal(researchBatch1Sources[0].peerReviewStatus, "peer-reviewed");
  assert.equal(researchBatch1Observations[0].reviewStatus, "reviewed");
});
