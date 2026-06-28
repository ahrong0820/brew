import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const workflow = await readFile(
  path.resolve(process.cwd(), ".github/workflows/validate-pr.yml"),
  "utf8",
);
const scenario = await readFile(
  path.resolve(process.cwd(), "e2e/user-flow.mjs"),
  "utf8",
);

test("PR validation builds the static export before browser E2E", () => {
  const buildIndex = workflow.indexOf("Build GitHub Pages");
  const exportIndex = workflow.indexOf("Validate static export");
  const e2eIndex = workflow.indexOf("Run mobile browser E2E");
  assert.ok(buildIndex >= 0);
  assert.ok(exportIndex > buildIndex);
  assert.ok(e2eIndex > exportIndex);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.match(workflow, /node e2e\/user-flow\.mjs/);
});

test("browser E2E covers persistence, verified source, feedback and isolation", () => {
  assert.match(scenario, /page\.reload/);
  assert.match(scenario, /공식·검증/);
  assert.match(scenario, /추출 완료/);
  assert.match(scenario, /personalRecipe\?\.version/);
  assert.match(scenario, /assert\.notEqual\(cleverProfile\.id, v60Profile\.id\)/);
  assert.match(scenario, /hiddenFloatingControls/);
});
