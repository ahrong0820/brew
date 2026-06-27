import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("feedback requires manual pace and taste before saving", async () => {
  const tracker = await readProjectFile("app/BrewSessionFeedbackTracker.tsx");

  assert.match(tracker, /BrewPaceSelector/);
  assert.match(tracker, /brewPaceAssessment/);
  assert.match(tracker, /추출 속도와 맛 평가를 모두 선택/);
  assert.match(tracker, /이 숫자는 조정 진단에 사용하지 않습니다/);
  assert.match(tracker, /brewPaceAssessment,/);
});

test("pace selector offers fast in-range and slow choices", async () => {
  const selector = await readProjectFile("app/BrewPaceSelector.tsx");

  assert.match(selector, /value: "fast"/);
  assert.match(selector, /value: "in-range"/);
  assert.match(selector, /value: "slow"/);
  assert.match(selector, /타이머 숫자가 아니라 실제 드로다운/);
  assert.match(selector, /aria-pressed=\{selected\}/);
});

test("feedback storage persists user pace separately from timer time", async () => {
  const feedback = await readProjectFile("lib/brew/sessionFeedback.ts");
  const types = await readProjectFile("lib/types/coffee.ts");

  assert.match(feedback, /brewPaceAssessment\?: BrewPaceAssessment/);
  assert.match(feedback, /input\.brewPaceAssessment \?\? session\.brewPaceAssessment/);
  assert.match(types, /export type BrewPaceAssessment = "fast" \| "in-range" \| "slow"/);
  assert.match(types, /Timer value is retained for the record but is not used for dial-in diagnosis/);
});
