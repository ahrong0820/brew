import assert from "node:assert/strict";
import test from "node:test";

import { tetsuDefault } from "../data/tetsuDefault.ts";
import { scaleRecipeDose } from "../lib/recipes/scaleRecipeDose.ts";

test("scales THE NEO BREW recipe snapshot to the selected 15g dose", () => {
  const scaled = scaleRecipeDose(tetsuDefault, 15);

  assert.notEqual(scaled, tetsuDefault);
  assert.equal(scaled.dose, 15);
  assert.equal(scaled.water, 225);
  assert.equal(scaled.steps.at(-1)?.targetWater, 225);
  assert.deepEqual(
    scaled.steps.map((step) => step.targetWater),
    [23, 45, 68, 90, 113, 135, 158, 180, 203, 225],
  );

  assert.equal(tetsuDefault.dose, 20);
  assert.equal(tetsuDefault.water, 300);
  assert.equal(tetsuDefault.steps.at(-1)?.targetWater, 300);
});

test("returns the original recipe when the dose is unchanged or invalid", () => {
  assert.equal(scaleRecipeDose(tetsuDefault, 20), tetsuDefault);
  assert.equal(scaleRecipeDose(tetsuDefault, Number.NaN), tetsuDefault);
  assert.equal(scaleRecipeDose(tetsuDefault, 0), tetsuDefault);
});
