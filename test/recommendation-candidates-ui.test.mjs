import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recommendation drawer ranks three candidates and applies the selected recipe", async () => {
  const drawer = await readProjectFile("app/RecommendationDrawer.tsx");

  assert.match(drawer, /rankBaristaRecipes/);
  assert.match(drawer, /setRecipeMatches\(matches\)/);
  assert.match(drawer, /setSelectedRecipeId\(firstRecipeId \?\? null\)/);
  assert.match(drawer, /baristaRecipeId/);
  assert.match(drawer, /selectRecipeCandidate/);
  assert.match(drawer, /<RecommendationCandidates/);
});

test("candidate cards expose rank, fit score, reasons and pressed selection state", async () => {
  const candidates = await readProjectFile("app/RecommendationCandidates.tsx");

  assert.match(candidates, /1순위 추천/);
  assert.match(candidates, /순위 대안/);
  assert.match(candidates, /적합도 \{match\.score\}/);
  assert.match(candidates, /match\.reasons\.slice\(0, 2\)/);
  assert.match(candidates, /aria-pressed=\{selected\}/);
  assert.match(candidates, /현재 선택됨/);
});

test("changing recommendation inputs clears stale candidates and results", async () => {
  const drawer = await readProjectFile("app/RecommendationDrawer.tsx");

  assert.match(drawer, /function clearGeneratedRecommendation\(\)/);
  assert.match(drawer, /setRecipeMatches\(\[\]\)/);
  assert.match(drawer, /setSelectedRecipeId\(null\)/);
  assert.match(drawer, /setRecommendation\(null\)/);
  assert.match(drawer, /aria-live="polite"/);
});
