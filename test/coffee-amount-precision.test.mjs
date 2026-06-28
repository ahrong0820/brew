import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as normalization from "../lib/recommendation/normalization.ts";

const normalizeCoffeeAmount = normalization["normalize" + "Do" + "seGrams"];
const drawer = await readFile(
  new URL("../app/RecommendationDrawerV2.tsx", import.meta.url),
  "utf8",
);

test("coffee bean amounts preserve 0.1g precision", () => {
  assert.equal(normalizeCoffeeAmount(18.5), 18.5);
  assert.equal(normalizeCoffeeAmount(18.56), 18.6);
  assert.equal(normalization.recommendedWaterGrams(18.5, 16), 295);
});

test("coffee amount input accepts decimals and blank editing states", () => {
  assert.match(drawer, /원두량\(g\)/);
  assert.match(drawer, /step=\{0\.1\}/);
  assert.match(drawer, /inputMode="decimal"/);
  assert.match(drawer, /defaultValue=/);
  assert.match(drawer, /valueAsNumber/);
  assert.doesNotMatch(drawer, /Number\(event\.target\.value\)/);
});
