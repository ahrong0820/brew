import assert from "node:assert/strict";
import test from "node:test";

import {
  formatGrindPresentation,
  recommendationReasonCategory,
} from "../lib/recommendation/presentation.ts";

test("grind presentation separates original, converted, calibration, source, and range", () => {
  const text = formatGrindPresentation({
    original: "중간보다 굵은 분쇄",
    start: "7.8",
    unit: "dial",
    calibration: "사용자 영점 · 버 비접촉 영점",
    source: "원본 레시피 분쇄 의도",
    safeRange: "5.5~8.5",
  });

  assert.match(text, /원본 표현: 중간보다 굵은 분쇄/);
  assert.match(text, /변환 시작값: 7.8 dial/);
  assert.match(text, /영점 기준: 사용자 영점/);
  assert.match(text, /적용 근거: 원본 레시피 분쇄 의도/);
  assert.match(text, /안전 범위: 5.5~8.5/);
});

test("unknown calibration avoids forcing a numeric start", () => {
  const text = formatGrindPresentation({
    original: "중간 분쇄",
    calibration: "영점 미확인",
  });

  assert.match(text, /변환 시작값: 숫자 변환 안 함/);
  assert.match(text, /안전 범위: 미확인/);
});

test("reason labels remain grouped into user-facing categories", () => {
  assert.equal(recommendationReasonCategory("[맛 목표] 밸런스"), "맛 목표");
  assert.equal(recommendationReasonCategory("[원두 적합] 워시드"), "원두 적합");
  assert.equal(recommendationReasonCategory("[개인 성공] 안정"), "개인 성공");
  assert.equal(recommendationReasonCategory("출처 설명"), "기타");
});
