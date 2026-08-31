import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile("app/page.tsx", "utf8");
const catalogSource = await readFile("app/RecipeCatalog.tsx", "utf8");
const timerPanelSource = await readFile("app/BrewTimerPanel.tsx", "utf8");
const customEditorSource = await readFile("app/CustomRecipeEditor.tsx", "utf8");
const timerHookSource = await readFile("app/hooks/useBrewTimer.ts", "utf8");
const layoutSource = await readFile("app/layout.tsx", "utf8");

test("mobile recipe behavior is rendered explicitly by React boundaries", () => {
  for (const marker of [
    'data-main-content="true"',
    "<RecipeCatalog",
    "<CustomRecipeEditor",
    "<BrewTimerPanel",
  ]) {
    assert.ok(pageSource.includes(marker), `page.tsx must include ${marker}`);
  }

  for (const marker of [
    'data-recipe-list="true"',
    'data-recipe-row="true"',
    "aria-current={selected",
  ]) {
    assert.ok(catalogSource.includes(marker), `RecipeCatalog.tsx must include ${marker}`);
  }

  assert.match(timerPanelSource, /data-timer-panel="true"/);
  assert.match(timerPanelSource, /id="brew-timer-panel"/);
  assert.match(customEditorSource, /data-custom-editor-open/);
  assert.match(customEditorSource, /setCustomEditorOpen/);
  assert.match(timerHookSource, /scrollTimerIntoViewOnMobile/);
});

test("fragile mobile recipe DOM postprocessing remains removed", () => {
  assert.equal(existsSync("app/MobileRecipeEnhancer.tsx"), false);
  assert.equal(layoutSource.includes("MobileRecipeEnhancer"), false);

  for (const source of [
    pageSource,
    catalogSource,
    timerPanelSource,
    customEditorSource,
    timerHookSource,
  ]) {
    assert.equal(source.includes("directDivs[1]"), false);
    assert.equal(source.includes("document.createElement"), false);
    assert.equal(source.includes("MutationObserver"), false);
  }
});
