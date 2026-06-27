import assert from "node:assert/strict";
import test from "node:test";

import { fixedConditionLabels } from "../lib/recommendation/adjustmentContext.ts";

const snapshot = {
  sourceTemplateId: "jis-4666",
  sourceTemplateName: "정인성 4666 오리지널",
  brewerType: "v60",
  drinkStyle: "hot",
  doseGrams: 20,
  waterGrams: 320,
  ratio: 16,
  temperatureCelsius: 92,
  grindLevel: 7,
  grinderDisplayValue: "7.0 다이얼 · 범위 6.8~7.2",
  totalTimeSeconds: 160,
  targetTimeMinSeconds: 130,
  targetTimeMaxSeconds: 160,
  steps: [],
};

test("grind adjustment fixes temperature ratio and pour", () => {
  assert.deepEqual(fixedConditionLabels("grind", snapshot), [
    "온도 92℃",
    "비율 1:16",
    "푸어 순서와 물줄기 유지",
  ]);
});

test("temperature adjustment keeps grinder ratio and pour", () => {
  const conditions = fixedConditionLabels("temperature", snapshot);
  assert.ok(conditions.some((value) => value.startsWith("분쇄도")));
  assert.ok(conditions.some((value) => value.startsWith("비율")));
  assert.ok(!conditions.some((value) => value.startsWith("온도")));
});

test("ratio adjustment keeps grinder temperature and pour", () => {
  const conditions = fixedConditionLabels("ratio", snapshot);
  assert.ok(conditions.some((value) => value.startsWith("분쇄도")));
  assert.ok(conditions.some((value) => value.startsWith("온도")));
  assert.ok(!conditions.some((value) => value.startsWith("비율")));
});
