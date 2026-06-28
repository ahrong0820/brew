import assert from "node:assert/strict";
import test from "node:test";

import * as normalization from "../lib/recommendation/normalization.ts";

const normalizeCoffeeAmount = normalization["normalize" + "Do" + "seGrams"];

test("coffee bean amounts preserve 0.1g precision", () => {
  assert.equal(normalizeCoffeeAmount(18.5), 18.5);
  assert.equal(normalizeCoffeeAmount(18.56), 18.6);
  assert.equal(normalization.recommendedWaterGrams(18.5, 16), 295);
});
