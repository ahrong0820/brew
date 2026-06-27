import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("personal recipe state is versioned", async () => {
  const source = await readFile(new URL("../lib/types/coffee.ts", import.meta.url), "utf8");
  assert.match(source, /PersonalRecipeState/);
  assert.match(source, /PersonalRecipeVersion/);
  assert.match(source, /successfulBrewCount/);
});
