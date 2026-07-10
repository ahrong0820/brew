import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildRecipeManifest } from "./recipe-manifest.mjs";

const [deploymentSha = process.env.GITHUB_SHA, output = "public/recipe-manifest.json"] =
  process.argv.slice(2);

try {
  const manifest = buildRecipeManifest({ deploymentSha });
  const target = path.resolve(output);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote recipe manifest ${target} for ${deploymentSha}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
