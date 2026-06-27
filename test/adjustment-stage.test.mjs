import assert from "node:assert/strict";
import test from "node:test";

import { personalizationStageForSuccessCount } from "../lib/recommendation/adjustmentContext.ts";
import {
  personalizationStageLabel,
  personalizationStageMessage,
  tastingResultLabel,
} from "../lib/recommendation/adjustmentLabels.ts";

test("personalization stage progresses with successful brews", () => {
  assert.equal(personalizationStageForSuccessCount(0), "trial");
  assert.equal(personalizationStageForSuccessCount(1), "provisional");
  assert.equal(personalizationStageForSuccessCount(2), "stable");
  assert.equal(personalizationStageForSuccessCount(5), "stable");
});

test("stage labels and messages explain reproducibility", () => {
  assert.equal(personalizationStageLabel("trial"), "시험 중");
  assert.equal(personalizationStageLabel("provisional"), "잠정 설정");
  assert.equal(personalizationStageLabel("stable"), "안정 설정");
  assert.match(personalizationStageMessage("trial", 0), /좋음 평가가 없습니다/);
  assert.match(personalizationStageMessage("provisional", 1), /한 번 더 재현/);
  assert.match(personalizationStageMessage("stable", 3), /3회 재현/);
});

test("taste labels remain explicit", () => {
  assert.equal(tastingResultLabel("good"), "좋음");
  assert.equal(tastingResultLabel("too-weak"), "너무 연함");
  assert.equal(tastingResultLabel(undefined), "미평가");
});
