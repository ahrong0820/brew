import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/validate-pr.yml", import.meta.url),
  "utf8",
);
const scenario = await readFile(
  new URL("./e2e/user-flow.cjs", import.meta.url),
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
});

test("browser E2E covers persistence, verified source, feedback and isolation", () => {
  assert.match(scenario, /page\.reload/);
  assert.match(scenario, /공식·검증/);
  assert.match(scenario, /추출 완료/);
  assert.match(scenario, /personalRecipe\?\.version/);
  assert.match(scenario, /assert\.notEqual\(cleverProfile\.id, v60Profile\.id\)/);
  assert.match(scenario, /hiddenFloatingControls/);
});
