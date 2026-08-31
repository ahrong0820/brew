import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const read = (file) => readFile(path.resolve(process.cwd(), file), "utf8");
const packageJson = JSON.parse(await read("package.json"));
const lockfile = await read("pnpm-lock.yaml");
const prWorkflow = await read(".github/workflows/validate-pr.yml");
const deployWorkflow = await read(".github/workflows/deploy-pages.yml");
const readme = await read("README.md");
const viteConfig = await read("vite.config.ts");

test("primary development and production scripts use Next.js while Vinext stays explicit", () => {
  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts["build:github"], "next build");
  assert.equal(packageJson.scripts.start, "next start");
  assert.equal(packageJson.scripts["dev:vinext"], "vinext dev");
  assert.equal(packageJson.scripts["build:vinext"], "vinext build");
  assert.equal(packageJson.scripts["start:vinext"], "vinext start");
  assert.match(viteConfig, /import vinext from "vinext"/);
  assert.match(readme, /주 개발·빌드·GitHub Pages 운영 경로는 Next\.js로 통일/);
  assert.match(readme, /pnpm dev:vinext/);
});

test("Playwright is pinned in dependency metadata and CI does not mutate package files", () => {
  assert.equal(packageJson.devDependencies.playwright, "1.55.0");
  assert.match(
    lockfile,
    /playwright:\n\s+specifier: 1\.55\.0\n\s+version: 1\.55\.0/,
  );
  assert.match(lockfile, /\n  playwright@1\.55\.0:/);

  for (const workflow of [prWorkflow, deployWorkflow]) {
    assert.doesNotMatch(workflow, /pnpm add .*playwright/);
    assert.match(workflow, /pnpm exec playwright install --with-deps chromium/);
    assert.match(workflow, /pnpm install --frozen-lockfile/);
  }
});

test("artifact actions use current non-deprecated major versions", () => {
  assert.match(prWorkflow, /actions\/upload-artifact@v7/);
  assert.match(prWorkflow, /actions\/download-artifact@v8/);
  assert.doesNotMatch(prWorkflow, /actions\/(?:upload|download)-artifact@v4/);
  assert.match(deployWorkflow, /actions\/upload-artifact@v7/);
  assert.doesNotMatch(deployWorkflow, /actions\/upload-artifact@v4/);
  assert.match(prWorkflow, /pnpm\/action-setup@v6\.0\.10/);
  assert.match(deployWorkflow, /pnpm\/action-setup@v6\.0\.10/);
});
