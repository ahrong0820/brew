import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const read = (file) => readFile(path.resolve(process.cwd(), file), "utf8");
const prWorkflow = await read(".github/workflows/validate-pr.yml");
const deployWorkflow = await read(".github/workflows/deploy-pages.yml");
const packageJson = JSON.parse(await read("package.json"));
const mobileNavigationScenario = await read("e2e/mobile-navigation-flow.mjs");
const timerScalingScenario = await read("e2e/timer-scaling-flow.mjs");
const timerReloadScenario = await read("e2e/timer-reload-flow.mjs");
const catalogScenario = await read("e2e/catalog-flow.mjs");
const storageScenario = await read("e2e/storage-migration-flow.mjs");
const recommendationScenario = await read("e2e/recommendation-flow.mjs");
const recommendationJourney = await read("e2e/helpers/recommendation-journey.mjs");

test("PR validation exposes independent checks and passes the static export to browser E2E", () => {
  const staticJobIndex = prWorkflow.indexOf("static-build:");
  const buildIndex = prWorkflow.indexOf("Build GitHub Pages static export");
  const exportIndex = prWorkflow.indexOf("Validate static export");
  const uploadIndex = prWorkflow.indexOf("Upload static export for browser E2E");
  const browserJobIndex = prWorkflow.indexOf("browser-e2e:");
  const downloadIndex = prWorkflow.indexOf("Download static export");
  const installIndex = prWorkflow.indexOf("Install Playwright Chromium");
  const e2eIndex = prWorkflow.indexOf("Run browser E2E");

  assert.match(prWorkflow, /\n  lint:\n/);
  assert.match(prWorkflow, /\n  typecheck:\n/);
  assert.match(prWorkflow, /\n  unit-tests:\n/);
  assert.ok(staticJobIndex >= 0);
  assert.ok(buildIndex > staticJobIndex);
  assert.ok(exportIndex > buildIndex);
  assert.ok(uploadIndex > exportIndex);
  assert.ok(browserJobIndex > uploadIndex);
  assert.match(prWorkflow.slice(browserJobIndex), /needs: static-build/);
  assert.ok(downloadIndex > browserJobIndex);
  assert.ok(installIndex > downloadIndex);
  assert.ok(e2eIndex > installIndex);
  assert.match(prWorkflow, /pr-static-export-\$\{\{ github\.run_id \}\}/);
  assert.match(prWorkflow, /playwright install --with-deps chromium/);
  assert.match(prWorkflow, /pnpm run test:e2e/);
  for (const scenario of [
    "catalog-flow.mjs",
    "storage-migration-flow.mjs",
    "timer-scaling-flow.mjs",
    "timer-reload-flow.mjs",
    "mobile-navigation-flow.mjs",
    "custom-recipe-flow.mjs",
    "recommendation-flow.mjs",
    "recipe-order-flow.mjs",
  ]) {
    assert.match(packageJson.scripts["test:e2e"], new RegExp(scenario.replaceAll(".", "\\.")));
  }
  assert.match(prWorkflow, /e2e-failure-\$\{\{ github\.run_id \}\}/);
});

test("PR events cannot trigger Pages deployment", () => {
  assert.match(deployWorkflow, /push:\n    branches: \["main"\]/);
  assert.match(deployWorkflow, /workflow_dispatch:/);
  assert.match(deployWorkflow, /github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(deployWorkflow, /pull_request_target:/);
  assert.doesNotMatch(deployWorkflow, /issue_comment:/);
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

test("mobile navigation E2E stays focused on tool routing and active brew visibility", () => {
  assert.match(mobileNavigationScenario, /data-mobile-coffee-nav/);
  assert.match(mobileNavigationScenario, /개인 레시피 버전/);
  assert.match(mobileNavigationScenario, /navigation stays hidden while brew is paused/);
  assert.doesNotMatch(mobileNavigationScenario, /custom-editor-open/);
  assert.doesNotMatch(mobileNavigationScenario, /low dose clamps/);
});

test("timer E2E separates scaling/input from reload persistence", () => {
  assert.match(timerScalingScenario, /blank dose stays editable/);
  assert.match(timerScalingScenario, /low dose clamps on commit/);
  assert.match(timerScalingScenario, /high dose clamps on commit/);
  assert.match(timerScalingScenario, /activeClock\.recipe\.water/);
  assert.doesNotMatch(timerScalingScenario, /page\.reload/);

  assert.match(timerReloadScenario, /page\.reload/);
  assert.match(timerReloadScenario, /running timer must survive reload/);
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

test("catalog and storage migration E2E have independent registry-derived expectations", () => {
  assert.match(catalogScenario, /defaultRecipeCatalogEntries/);
  assert.match(catalogScenario, /removedDefaultRecipeNames/);
  assert.doesNotMatch(catalogScenario, /malformed-json/);

  assert.match(storageScenario, /malformed-json/);
  assert.match(storageScenario, /custom-recipes-quarantine\.v1/);
  assert.match(storageScenario, /defaultRecipeIdAliases/);
  assert.doesNotMatch(storageScenario, /running timer must survive/);
});
