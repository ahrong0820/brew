import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("adjustment context is read from the same recipe-scoped profile", async () => {
  const source = await readProjectFile("lib/recommendation/readAdjustmentContext.ts");

  assert.match(source, /beanBrewProfileStore\.getById\(session\.profileId\)/);
  assert.match(source, /candidate\.profileId === session\.profileId/);
  assert.match(source, /sourceRecipeId: profile\?\.sourceRecipeId/);
  assert.match(source, /session\.recipeSnapshot\.sourceTemplateName/);
  assert.match(source, /fixedConditionLabels/);
});
