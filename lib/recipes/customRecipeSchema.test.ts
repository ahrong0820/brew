import assert from "node:assert/strict";
import test from "node:test";
import {
  customRecipeQuarantineStorageKey,
  customRecipesStorageKey,
  parseCustomRecipe,
  repairStoredCustomRecipeStorage,
} from "./customRecipeSchema.ts";

class MemoryStorage {
  items = new Map<string, string>();
  getItem(key: string) { return this.items.get(key) ?? null; }
  setItem(key: string, value: string) { this.items.set(key, value); }
  removeItem(key: string) { this.items.delete(key); }
}

function validRecipe() {
  return {
    id: "custom-1",
    name: "valid",
    origin: "나만의 레시피",
    method: "V60",
    profile: "balanced",
    tags: ["나만의 레시피"],
    dose: 20,
    water: 300,
    ratio: "1:15",
    temp: "92℃",
    grind: "medium",
    totalTime: 60,
    notes: [],
    steps: [{ label: "brew", start: 0, end: 60, targetWater: 300, cue: "pour" }],
  };
}

test("custom recipe parser accepts a complete finite recipe", () => {
  const recipe = validRecipe();
  assert.equal(parseCustomRecipe(recipe).recipe, recipe);
});

test("custom recipe parser rejects unsafe numeric and step data", () => {
  assert.match(parseCustomRecipe({ ...validRecipe(), dose: 0 }).reason ?? "", /dose/);
  assert.match(
    parseCustomRecipe({
      ...validRecipe(),
      steps: [{ label: "brew", start: 0, end: 60, targetWater: Number.NaN, cue: "pour" }],
    }).reason ?? "",
    /targetWater/,
  );
});

test("storage repair keeps valid recipes and quarantines rejected entries", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    customRecipesStorageKey,
    JSON.stringify([validRecipe(), { id: "custom-bad", name: "bad", steps: [{}] }]),
  );

  const result = repairStoredCustomRecipeStorage(storage);
  assert.equal(result.changed, true);
  assert.deepEqual(result.recipes.map((recipe) => recipe.id), ["custom-1"]);
  assert.deepEqual(JSON.parse(storage.getItem(customRecipesStorageKey) ?? "[]").map((item: { id: string }) => item.id), ["custom-1"]);
  assert.equal(JSON.parse(storage.getItem(customRecipeQuarantineStorageKey) ?? "[]").length, 1);
});

test("storage repair quarantines malformed JSON without throwing", () => {
  const storage = new MemoryStorage();
  storage.setItem(customRecipesStorageKey, "{broken");
  const result = repairStoredCustomRecipeStorage(storage);
  assert.equal(result.malformedJson, true);
  assert.equal(storage.getItem(customRecipesStorageKey), null);
  assert.equal(JSON.parse(storage.getItem(customRecipeQuarantineStorageKey) ?? "[]").length, 1);
});
