import assert from "node:assert/strict";
import test from "node:test";

import { jisV60FourServingHot } from "../../data/jisV60FourServingHot.ts";
import { jisVer2Default } from "../../data/jisVer2Default.ts";
import {
  clampRecipeDose,
  getRecipeDoseConstraints,
} from "./recipeDosePolicy.ts";
import { scaleRecipeDose } from "./scaleRecipeDose.ts";

test("fixed-dose recipes preserve their official dose and water values", () => {
  const constraints = getRecipeDoseConstraints(jisV60FourServingHot);

  assert.deepEqual(constraints, {
    min: 50,
    max: 50,
    fixed: true,
    note: "공식 4인분 레시피는 원두 50g 고정",
  });
  assert.equal(clampRecipeDose(jisV60FourServingHot, 40), 50);
  assert.strictEqual(scaleRecipeDose(jisV60FourServingHot, 40), jisV60FourServingHot);
  assert.equal(jisV60FourServingHot.brewWater, 550);
  assert.deepEqual(jisV60FourServingHot.bypassWater, { min: 250, max: 350 });
  assert.deepEqual(jisV60FourServingHot.finalWater, { min: 800, max: 900 });
  assert.deepEqual(
    jisV60FourServingHot.steps.map((step) => step.targetWater),
    [200, 400, 550, 550],
  );
});

test("existing recipes keep the default scalable 8g to 40g range", () => {
  assert.deepEqual(getRecipeDoseConstraints(jisVer2Default), {
    min: 8,
    max: 40,
    fixed: false,
    note: undefined,
  });
  assert.equal(clampRecipeDose(jisVer2Default, 50), 40);
  assert.equal(clampRecipeDose(jisVer2Default, 7), 8);
  assert.equal(scaleRecipeDose(jisVer2Default, 20).dose, 20);
});
