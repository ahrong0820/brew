import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readPage = () =>
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("reselecting an active recipe preserves the running clock", async () => {
  const page = await readPage();
  assert.match(page, /const sameTrackedRecipe =/);
  assert.match(page, /current\.recipe\?\.id === recipe\.id/);
  assert.ok(
    page.indexOf("if (sameTrackedRecipe)") <
      page.indexOf("clearBrewSessionClock();", page.indexOf("function selectRecipe")),
  );
});

test("active custom recipes cannot be deleted", async () => {
  const page = await readPage();
  assert.match(page, /function deleteCustomRecipe\(recipeId: string\)/);
  assert.match(page, /activeClock\.recipe\?\.id === recipeId/);
  assert.match(page, /진행 중인 사용자 레시피는 타이머를 완료하거나 초기화한 뒤 삭제/);
});

test("dose, filters and toggles expose bounded and accessible state", async () => {
  const page = await readPage();
  assert.match(page, /const \[doseInput, setDoseInput\] = useState/);
  assert.match(page, /nextDose >= 8 && nextDose <= 40/);
  assert.match(page, /syncTimerDose\(clampNumber\(Number\(doseInput\), 8, 40\)\)/);
  assert.match(page, /onBlur=\{commitTimerDoseInput\}/);
  assert.match(page, /aria-label="레시피 검색"/);
  assert.match(page, /aria-pressed=\{filter === option\}/);
  assert.match(page, /aria-pressed=\{alertsEnabled\}/);
  assert.match(page, /aria-pressed=\{selectedIsFavorite\}/);
  assert.match(page, /role="status"/);
  assert.match(page, /aria-live="polite"/);
});

test("empty searches and duplicate custom step labels remain stable", async () => {
  const page = await readPage();
  assert.match(page, /검색 조건에 맞는 레시피가 없습니다/);
  assert.match(page, /key=\{`\$\{selectedRecipe\.id\}-\$\{index\}-\$\{step\.label\}`\}/);
});

// This source-level regression suite complements the full lint, typecheck and static export CI.
