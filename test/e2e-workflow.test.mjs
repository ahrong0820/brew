import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const read = (file) => readFile(path.resolve(process.cwd(), file), "utf8");
const workflow = await read(".github/workflows/validate-pr.yml");
const timerScenario = await read("e2e/mobile-flow.mjs");
const recommendationScenario = await read("e2e/recommendation-flow.mjs");
const recommendationJourney = await read(
  "e2e/helpers/recommendation-journey.mjs",
);

test("PR validation builds and validates the static export before both mobile E2E flows", () => {
  const buildIndex = workflow.indexOf("Build GitHub Pages");
  const exportIndex = workflow.indexOf("Validate static export");
  const installIndex = workflow.indexOf("Install Playwright Chromium");
  const e2eIndex = workflow.indexOf("Run mobile browser E2E");

  assert.ok(buildIndex >= 0);
  assert.ok(exportIndex > buildIndex);
  assert.ok(installIndex > exportIndex);
  assert.ok(e2eIndex > installIndex);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.match(workflow, /node e2e\/mobile-flow\.mjs/);
  assert.match(workflow, /node e2e\/recommendation-flow\.mjs/);
  assert.match(workflow, /e2e-failure-\$\{\{ github\.run_id \}\}/);
});

test("timer mobile E2E covers the current regression-prone flows", () => {
  assert.match(timerScenario, /data-mobile-coffee-nav/);
  assert.match(timerScenario, /개인 레시피 버전/);
  assert.match(timerScenario, /blank dose must remain editable/);
  assert.match(timerScenario, /valid dose must update immediately/);
  assert.match(timerScenario, /low dose must clamp on blur/);
  assert.match(timerScenario, /high dose must clamp on blur/);
  assert.match(timerScenario, /recipe selection must synchronize dose draft/);
  assert.match(timerScenario, /mobile navigation must stay hidden while paused/);
});

test("recommendation E2E covers persistence, source selection and personal versions", () => {
  assert.match(recommendationScenario, /width: 390, height: 844/);
  assert.match(recommendationJourney, /registerBrazilWashedBean/);
  assert.match(recommendationJourney, /assertOfficialClever/);
  assert.match(recommendationJourney, /assertJisClever/);
  assert.match(recommendationJourney, /saveSuccessfulFeedback/);
  assert.match(recommendationJourney, /assertStablePersonalRecipe/);
  assert.match(recommendationJourney, /restoreFirstPersonalRecipeVersion/);
});
