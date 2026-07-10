import assert from "node:assert/strict";
import test from "node:test";
import {
  assertRecipeManifest,
  buildRecipeManifest,
} from "../scripts/recipe-manifest.mjs";

const sha = "c".repeat(40);

test("recipe manifest contains the exact canonical catalog", () => {
  const manifest = buildRecipeManifest({ deploymentSha: sha });
  assert.equal(manifest.recipeCount, 9);
  assert.deepEqual(manifest.recipeIds, [
    "tetsu-46",
    "tetsu-neo-2026",
    "anstar-6888",
    "jis-ver2-hot",
    "jis-484-15g-2026",
    "yong-light",
    "switch-devil",
    "hoffmann-clever-water-first",
    "jis-clever-1-11",
  ]);
  assert.equal(assertRecipeManifest(manifest, sha), manifest);
});

test("recipe manifest rejects a stale or incomplete catalog", () => {
  const manifest = buildRecipeManifest({ deploymentSha: sha });
  manifest.recipeIds = manifest.recipeIds.slice(0, -1);
  assert.throws(() => assertRecipeManifest(manifest, sha), /recipeIds mismatch/);
});
