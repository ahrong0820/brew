import assert from "node:assert/strict";
import test from "node:test";

import { decideAdjustmentAction } from "../lib/recommendation/adjustmentPolicy.ts";

const decide = (brewPaceAssessment, tastingResult) =>
  decideAdjustmentAction({ brewPaceAssessment, tastingResult });

test("fast drawdown and under-extracted taste selects finer grind", () => {
  assert.equal(decide("fast", "too-sour"), "finer");
  assert.equal(decide("fast", "not-sweet-enough"), "finer");
});

test("slow drawdown and rough or muted taste selects coarser grind", () => {
  assert.equal(decide("slow", "bitter-astringent"), "coarser");
  assert.equal(decide("slow", "aroma-muted"), "coarser");
});

test("in-range drawdown allows temperature advice", () => {
  assert.equal(decide("in-range", "too-sour"), "hotter");
  assert.equal(decide("in-range", "not-sweet-enough"), "hotter");
  assert.equal(decide("in-range", "bitter-astringent"), "cooler");
});

test("contradictory pace and taste avoids forcing grind", () => {
  assert.equal(decide("fast", "bitter-astringent"), "cooler");
  assert.equal(decide("slow", "too-sour"), "hotter");
});

test("strength feedback adjusts ratio regardless of timer", () => {
  assert.equal(decide("fast", "too-weak"), "less-water");
  assert.equal(decide("slow", "too-strong"), "more-water");
});

test("legacy records without pace use taste only and never timer inference", () => {
  assert.equal(decide(undefined, "too-sour"), "hotter");
  assert.equal(decide(undefined, "bitter-astringent"), "cooler");
  assert.equal(decide(undefined, "good"), "hold");
});
