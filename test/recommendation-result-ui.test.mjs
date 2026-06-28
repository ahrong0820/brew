import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../app/RecommendationDrawerV2.tsx", import.meta.url),
  "utf8",
);

test("recommendation core values remain sticky while reviewing details", () => {
  assert.match(source, /sticky top-0/);
  assert.match(source, /원두 \/ 물/);
  assert.match(source, /목표 시간/);
});

test("recipe source and personal success badges are explicit", () => {
  assert.match(source, /공식·검증/);
  assert.match(source, /참고 레시피/);
  assert.match(source, /개인 성공/);
  assert.match(source, /잠정/);
  assert.match(source, /안정/);
});

test("original grind wording and converted grinder value are separated", () => {
  assert.match(source, /원본 레시피 표현/);
  assert.match(source, /현재 그라인더 변환 시작값/);
  assert.match(source, /영점 기준/);
  assert.match(source, /모델 안전 범위/);
});

test("origin, variety and current variable effects are visible", () => {
  assert.match(source, /산지·품종 추천 영향/);
  assert.match(source, /이번 추출에서 적용된 변경/);
  assert.match(source, /\[클레버 분쇄\]/);
  assert.match(source, /\[푸어 구조\]/);
});
