import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const workflow = await readFile(
  path.resolve(process.cwd(), ".github/workflows/validate-pr.yml"),
  "utf8",
);
const scenario = await readFile(
  path.resolve(process.cwd(), "e2e/mobile-flow.mjs"),
  "utf8",
);

test("PR validation builds and validates the static export before mobile E2E", () => {
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
  assert.match(workflow, /e2e-failure-\$\{\{ github\.run_id \}\}/);
});

test("mobile browser E2E covers the current regression-prone flows", () => {
  assert.match(scenario, /data-mobile-coffee-nav/);
  assert.match(scenario, /개인 레시피 버전/);
  assert.match(scenario, /blank dose must remain editable/);
  assert.match(scenario, /invalid dose must restore the last valid value/);
  assert.match(scenario, /data-recipe-row/);
  assert.match(scenario, /mobile navigation must stay hidden while paused/);
  assert.match(scenario, /viewport: \{ width: 390, height: 844 \}/);
});
