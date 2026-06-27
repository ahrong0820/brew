import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("personalized profile data stores the selected barista recipe ID", async () => {
  const coffeeTypes = await readProjectFile("lib/types/coffee.ts");
  const brewLaunch = await readProjectFile("lib/recommendation/brewLaunch.ts");

  assert.match(coffeeTypes, /sourceRecipeId\?: string/);
  assert.match(
    brewLaunch,
    /sourceRecipeId: input\.recommendation\.sourceRecipeId/,
  );
  assert.match(
    brewLaunch,
    /input\.recommendation\.sourceRecipeId \?\?\s*`recommendation-/,
  );
  assert.match(
    brewLaunch,
    /sourceRecipeId: input\.recommendation\.sourceRecipeId,/,
  );
});

test("recommendation lookup resolves and matches the same recipe scope", async () => {
  const engine = await readProjectFile("lib/recommendation/engine.ts");

  assert.match(engine, /function resolvedBaristaRecipeId/);
  assert.match(engine, /selectBaristaRecipe/);
  assert.match(engine, /const sourceRecipeId = resolvedBaristaRecipeId\(input\)/);
  assert.match(engine, /sourceRecipeId,/);
  assert.match(engine, /baristaRecipeId: sourceRecipeId/);
  assert.match(engine, /같은 레시피 조건/);
});

test("storage integrity deduplication inherits recipe-aware profile keys", async () => {
  const integrity = await readProjectFile("lib/storage/integrity.ts");
  const identity = await readProjectFile("lib/brew/profileIdentity.ts");

  assert.match(integrity, /brewProfileIdentityKey\(profile\)/);
  assert.match(identity, /normalizeSourceRecipeId\(identity\.sourceRecipeId\)/);
});
