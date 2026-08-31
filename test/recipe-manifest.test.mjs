import assert from "node:assert/strict";
import test from "node:test";
import { defaultRecipeCatalogEntries } from "../lib/recipes/defaultRecipeCatalog.ts";
import {
  assertRecipeManifest,
  buildRecipeManifest,
} from "../scripts/recipe-manifest.mjs";

const sha = "c".repeat(40);

test("recipe manifest contains the exact canonical registry catalog", () => {
  const manifest = buildRecipeManifest({ deploymentSha: sha });
  assert.equal(manifest.recipeCount, defaultRecipeCatalogEntries.length);
  assert.deepEqual(
    manifest.recipeIds,
    defaultRecipeCatalogEntries.map(({ id }) => id),
  );
  assert.deepEqual(
    manifest.recipes,
    defaultRecipeCatalogEntries.map((entry) => ({ ...entry })),
  );
  assert.equal(assertRecipeManifest(manifest, sha), manifest);
});

test("recipe manifest rejects a stale or incomplete catalog", () => {
  const manifest = buildRecipeManifest({ deploymentSha: sha });
  manifest.recipeIds = manifest.recipeIds.slice(0, -1);
  assert.throws(() => assertRecipeManifest(manifest, sha), /recipeIds mismatch/);
});
