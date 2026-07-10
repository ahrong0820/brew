import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildRecipeManifest } from "../scripts/recipe-manifest.mjs";

import {
  extractDeploymentSha,
  validateStaticExport,
} from "../scripts/validate-static-export.mjs";

const expectedSha = "a".repeat(40);

async function createStaticExport({
  htmlSha = expectedSha,
  latestSha = expectedSha,
  immutableSha = expectedSha,
} = {}) {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "brew-export-"));
  const deploymentsDirectory = path.join(outputDirectory, "deployments");

  await Promise.all([
    mkdir(path.join(outputDirectory, "_next")),
    mkdir(deploymentsDirectory),
  ]);

  const latestMetadata = `${JSON.stringify({ sha: latestSha }, null, 2)}\n`;
  const immutableMetadata = `${JSON.stringify({ sha: immutableSha }, null, 2)}\n`;

  await Promise.all([
    writeFile(
      path.join(outputDirectory, "index.html"),
      `<html><head><meta content="${htmlSha}" name="deployment-sha"></head></html>`,
    ),
    writeFile(path.join(outputDirectory, "deployment.json"), latestMetadata),
    writeFile(
      path.join(deploymentsDirectory, `${expectedSha}.json`),
      immutableMetadata,
    ),
    writeFile(
      path.join(outputDirectory, "recipe-manifest.json"),
      `${JSON.stringify(buildRecipeManifest({ deploymentSha: expectedSha }), null, 2)}\n`,
    ),
  ]);

  return outputDirectory;
}

test("extractDeploymentSha accepts attributes in any order", () => {
  const html = `<meta content='${expectedSha}' data-build="test" name='deployment-sha'>`;

  assert.equal(extractDeploymentSha(html), expectedSha);
});

test("validateStaticExport accepts a complete matching export", async (context) => {
  const outputDirectory = await createStaticExport();
  context.after(() => rm(outputDirectory, { recursive: true, force: true }));

  const result = await validateStaticExport(outputDirectory, expectedSha);

  assert.equal(result.outputDirectory, outputDirectory);
  assert.equal(result.sha, expectedSha);
});

test("validateStaticExport rejects mismatched deployment metadata", async (context) => {
  const outputDirectory = await createStaticExport({
    latestSha: "b".repeat(40),
    immutableSha: "b".repeat(40),
  });
  context.after(() => rm(outputDirectory, { recursive: true, force: true }));

  await assert.rejects(
    validateStaticExport(outputDirectory, expectedSha),
    /deployment\.json SHA mismatch/,
  );
});
