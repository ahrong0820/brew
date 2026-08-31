import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readPage = () => readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const readCatalog = () =>
  readFile(new URL("../app/RecipeCatalog.tsx", import.meta.url), "utf8");
const readTimerHook = () =>
  readFile(new URL("../app/hooks/useBrewTimer.ts", import.meta.url), "utf8");
const readTimerPanel = () =>
  readFile(new URL("../app/BrewTimerPanel.tsx", import.meta.url), "utf8");
const readDosePolicy = () =>
  readFile(new URL("../lib/recipes/recipeDosePolicy.ts", import.meta.url), "utf8");
const readCustomEditor = () =>
  readFile(new URL("../app/CustomRecipeEditor.tsx", import.meta.url), "utf8");

test("reselecting an active recipe preserves the running clock", async () => {
  const timerHook = await readTimerHook();
  assert.match(timerHook, /const sameTrackedRecipe =/);
  assert.match(timerHook, /current\.recipe\?\.id === recipe\.id/);
  assert.ok(
    timerHook.indexOf("if (sameTrackedRecipe)") <
      timerHook.indexOf("clearBrewSessionClock();", timerHook.indexOf("const selectRecipe")),
  );
});

test("active custom recipes cannot be deleted", async () => {
  const editor = await readCustomEditor();
  assert.match(editor, /function deleteCustomRecipe\(recipeId: string\)/);
  assert.match(editor, /activeClock\.recipe\?\.id === recipeId/);
  assert.match(editor, /진행 중인 사용자 레시피는 타이머를 완료하거나 초기화한 뒤 삭제/);
});

test("dose, filters and toggles expose bounded and accessible state", async () => {
  const [timerHook, timerPanel, dosePolicy, catalog] = await Promise.all([
    readTimerHook(),
    readTimerPanel(),
    readDosePolicy(),
    readCatalog(),
  ]);
  assert.match(timerHook, /const \[doseInput, setDoseInput\] = useState/);
  assert.match(timerHook, /getRecipeDoseConstraints\(selectedRecipe\)/);
  assert.match(timerHook, /syncTimerDose\(clampRecipeDose\(selectedRecipe, Number\(doseInput\)\)\)/);
  assert.match(dosePolicy, /defaultRecipeDoseMin = 8/);
  assert.match(dosePolicy, /defaultRecipeDoseMax = 40/);
  assert.match(dosePolicy, /policy\?\.type === "fixed"/);
  assert.match(timerPanel, /readOnly=\{timer\.doseFixed\}/);
  assert.match(timerPanel, /aria-readonly=\{timer\.doseFixed\}/);
  assert.match(timerPanel, /onBlur=\{timer\.commitDoseInput\}/);
  assert.match(catalog, /aria-label="레시피 검색"/);
  assert.match(catalog, /aria-pressed=\{filter === option\}/);
  assert.match(timerPanel, /aria-pressed=\{timer\.alertsEnabled\}/);
  assert.match(timerPanel, /aria-pressed=\{selectedIsFavorite\}/);
  assert.match(timerPanel, /role="status"/);
  assert.match(timerPanel, /aria-live="polite"/);
});

test("empty searches and duplicate recipe step labels remain stable", async () => {
  const [catalog, timerPanel] = await Promise.all([readCatalog(), readTimerPanel()]);
  assert.match(catalog, /검색 조건에 맞는 레시피가 없습니다/);
  assert.match(
    timerPanel,
    /key=\{`\$\{selectedRecipe\.id\}-\$\{index\}-\$\{step\.label\}`\}/,
  );
});

test("page composes independent catalog, editor and timer boundaries", async () => {
  const page = await readPage();
  assert.match(page, /<RecipeCatalog/);
  assert.match(page, /<CustomRecipeEditor/);
  assert.match(page, /<BrewTimerPanel/);
  assert.match(page, /useBrewTimer/);
  assert.match(page, /useRecipeLibraryStorage/);
  assert.doesNotMatch(page, /subscribeToBrewSessionClock/);
  assert.doesNotMatch(page, /startBrewSessionClock/);
  assert.doesNotMatch(page, /const \[draftName/);
});

// This source-level regression suite complements the full lint, typecheck and static export CI.
