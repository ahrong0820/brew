import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const script = packageJson.scripts["test:e2e"];

const scenarios = [
  "catalog-flow.mjs",
  "storage-migration-flow.mjs",
  "timer-scaling-flow.mjs",
  "timer-reload-flow.mjs",
  "mobile-navigation-flow.mjs",
  "custom-recipe-flow.mjs",
  "recommendation-flow.mjs",
  "recipe-order-flow.mjs",
];

test("browser E2E is split by major responsibility", async () => {
  for (const scenario of scenarios) {
    assert.match(script, new RegExp(scenario.replaceAll(".", "\\.")));
    assert.equal(existsSync(`e2e/${scenario}`), true, `${scenario} must exist`);
  }
  assert.doesNotMatch(script, /catalog-storage-timer-flow/);
  assert.doesNotMatch(script, /mobile-flow\.mjs/);
});

test("split E2E scenarios share the static browser harness", async () => {
  for (const scenario of scenarios.filter((name) => !["recommendation-flow.mjs", "recipe-order-flow.mjs"].includes(name))) {
    const source = await readFile(`e2e/${scenario}`, "utf8");
    assert.match(source, /static-e2e-harness/);
  }

  const catalog = await readFile("e2e/catalog-flow.mjs", "utf8");
  assert.match(catalog, /defaultRecipeCatalogEntries/);
  assert.match(catalog, /removedDefaultRecipeNames/);
});
