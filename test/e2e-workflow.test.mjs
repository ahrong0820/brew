import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const read = (file) => readFile(path.resolve(process.cwd(), file), "utf8");
const prWorkflow = await read(".github/workflows/validate-pr.yml");
const deployWorkflow = await read(".github/workflows/deploy-pages.yml");
const packageJson = JSON.parse(await read("package.json"));
const timerScenario = await read("e2e/mobile-flow.mjs");
const recommendationScenario = await read("e2e/recommendation-flow.mjs");
const integrityScenario = await read("e2e/catalog-storage-timer-flow.mjs");
const recommendationJourney = await read(
  "e2e/helpers/recommendation-journey.mjs",
);

test("PR validation builds and validates the static export before all browser E2E flows", () => {
  const buildIndex = prWorkflow.indexOf("Build GitHub Pages");
  const exportIndex = prWorkflow.indexOf("Validate static export");
  const installIndex = prWorkflow.indexOf("Install Playwright Chromium");
  const e2eIndex = prWorkflow.indexOf("Run mobile browser E2E");

  assert.ok(buildIndex >= 0);
  assert.ok(exportIndex > buildIndex);
  assert.ok(installIndex > exportIndex);
  assert.ok(e2eIndex > installIndex);
  assert.match(prWorkflow, /playwright install --with-deps chromium/);
  assert.match(prWorkflow, /pnpm run test:e2e/);
  assert.match(packageJson.scripts["test:e2e"], /mobile-flow\.mjs/);
  assert.match(packageJson.scripts["test:e2e"], /recommendation-flow\.mjs/);
  assert.match(packageJson.scripts["test:e2e"], /catalog-storage-timer-flow\.mjs/);
  assert.match(prWorkflow, /e2e-failure-\$\{\{ github\.run_id \}\}/);
});

test("production deployment also blocks on browser E2E", () => {
  const exportIndex = deployWorkflow.indexOf("Validate static export");
  const installIndex = deployWorkflow.indexOf("Install Playwright Chromium");
  const e2eIndex = deployWorkflow.indexOf("Run browser E2E");
  const uploadIndex = deployWorkflow.indexOf("Upload Pages artifact");

  assert.ok(exportIndex >= 0);
  assert.ok(installIndex > exportIndex);
  assert.ok(e2eIndex > installIndex);
  assert.ok(uploadIndex > e2eIndex);
  assert.match(deployWorkflow, /pnpm run test:e2e/);
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

test("catalog integrity E2E covers storage corruption and timer reload", () => {
  assert.match(integrityScenario, /expectedRecipeNames/);
  assert.match(integrityScenario, /malformed-json/);
  assert.match(integrityScenario, /custom-recipes-quarantine\.v1/);
  assert.match(integrityScenario, /running timer must survive a reload/);
});
