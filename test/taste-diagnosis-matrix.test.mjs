import assert from "node:assert/strict";
import test from "node:test";

import { diagnoseTaste } from "../lib/recommendation/diagnosisMatrix.ts";

const base = {
  brewerType: "v60",
  brewPaceAssessment: "in-range",
  repeatedGrindDirectionCount: 0,
};

test("sour and weak chooses extraction before strength when flow permits", () => {
  assert.deepEqual(
    diagnoseTaste({ ...base, issues: ["sour", "weak"] }),
    {
      variable: "grind",
      direction: "finer",
      reason:
        "시고 묽은 미추출 조합이므로 다른 조건을 유지하고 분쇄도를 한 단계 곱게 합니다.",
    },
  );
});

test("sour and weak with slow flow avoids another finer grind", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    brewPaceAssessment: "slow",
    issues: ["sour", "weak"],
  });
  assert.equal(diagnosis.variable, "temperature");
  assert.equal(diagnosis.direction, "hotter");
});

test("sour and astringent moves to pour structure for V60", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    issues: ["sour", "astringent"],
  });
  assert.equal(diagnosis.variable, "pour-structure");
  assert.equal(diagnosis.direction, "gentler-pour");
});

test("sour and astringent moves to agitation for Clever", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    brewerType: "clever",
    issues: ["sour", "astringent"],
  });
  assert.equal(diagnosis.variable, "agitation");
  assert.equal(diagnosis.direction, "less-agitation");
});

test("bitter and astringent lowers temperature for V60", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    issues: ["bitter", "astringent"],
  });
  assert.equal(diagnosis.variable, "temperature");
  assert.equal(diagnosis.direction, "cooler");
});

test("sweetness shortage raises temperature", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    issues: ["sweetness-low"],
  });
  assert.equal(diagnosis.variable, "temperature");
  assert.equal(diagnosis.direction, "hotter");
});

test("good aroma with weak body changes ratio only", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    issues: ["aroma-good", "body-low"],
  });
  assert.equal(diagnosis.variable, "ratio");
  assert.equal(diagnosis.direction, "less-water");
});

test("fast drawdown does not override over-extracted taste", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    brewPaceAssessment: "fast",
    issues: ["bitter"],
  });
  assert.equal(diagnosis.variable, "temperature");
  assert.equal(diagnosis.direction, "cooler");
});

test("slow drawdown does not override under-extracted taste", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    brewPaceAssessment: "slow",
    issues: ["sour"],
  });
  assert.equal(diagnosis.variable, "temperature");
  assert.equal(diagnosis.direction, "hotter");
});

test("two repeated Clever grind changes switch to immersion time", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    brewerType: "clever",
    brewPaceAssessment: "fast",
    repeatedGrindDirectionCount: 2,
    issues: ["sour"],
  });
  assert.equal(diagnosis.variable, "immersion-time");
  assert.equal(diagnosis.direction, "longer-immersion");
});

test("two repeated V60 grind changes switch to ratio for weak body", () => {
  const diagnosis = diagnoseTaste({
    ...base,
    brewPaceAssessment: "fast",
    repeatedGrindDirectionCount: 2,
    issues: ["sour", "weak"],
  });
  assert.equal(diagnosis.variable, "ratio");
  assert.equal(diagnosis.direction, "less-water");
});
