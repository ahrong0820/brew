import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile("app/page.tsx", "utf8");
const catalogSource = await readFile("app/RecipeCatalog.tsx", "utf8");
const layoutSource = await readFile("app/layout.tsx", "utf8");

test("mobile recipe behavior is rendered explicitly by React", () => {
  for (const marker of [
    'data-main-content="true"',
    'data-timer-panel="true"',
    "data-custom-editor-open",
    "setCustomEditorOpen",
    "scrollTimerIntoViewOnMobile",
    "<RecipeCatalog",
  ]) {
    assert.ok(pageSource.includes(marker), `page.tsx must include ${marker}`);
  }

  for (const marker of [
    'data-recipe-list="true"',
    'data-recipe-row="true"',
    "aria-current={selected",
  ]) {
    assert.ok(
      catalogSource.includes(marker),
      `RecipeCatalog.tsx must include ${marker}`,
    );
  }
});

test("fragile mobile recipe DOM postprocessing is removed", () => {
  assert.equal(existsSync("app/MobileRecipeEnhancer.tsx"), false);
  assert.equal(layoutSource.includes("MobileRecipeEnhancer"), false);
  assert.equal(pageSource.includes("directDivs[1]"), false);
  assert.equal(pageSource.includes("document.createElement"), false);
  assert.equal(pageSource.includes("MutationObserver"), false);
  assert.equal(catalogSource.includes("document.createElement"), false);
  assert.equal(catalogSource.includes("MutationObserver"), false);
});
