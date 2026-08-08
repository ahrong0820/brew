import assert from "node:assert/strict";
import test from "node:test";
import { defaultRecipes } from "../data/defaultRecipes.ts";
import {
  isRunnableTemperature,
  recipeTemperaturePresentation,
} from "../lib/recipes/recipeTemperature.ts";

test("every default recipe has an executable temperature presentation", () => {
  for (const recipe of defaultRecipes) {
    assert.equal(
      isRunnableTemperature(recipe.temperature, recipe.temp),
      true,
      `${recipe.id} must have a runnable temperature`,
    );
    assert.doesNotMatch(recipeTemperaturePresentation(recipe).display, /미확인/);
  }
});

test("unverified source temperatures are labeled as app defaults", () => {
  const expected = new Map([
    ["anstar-6888", 93],
    ["jis-484-15g-2026", 92],
  ]);

  for (const [id, celsius] of expected) {
    const recipe = defaultRecipes.find((candidate) => candidate.id === id);
    assert.ok(recipe);
    assert.equal(recipe.temperature?.status, "app-default");
    assert.equal(recipe.temperature?.celsius, celsius);
    assert.match(recipe.temp, /앱 시작값/);
    assert.ok(recipe.temperature?.note);
  }
});

test("verified temperature ranges preserve the official wording", () => {
  const recipe = defaultRecipes.find(
    (candidate) => candidate.id === "jis-clever-1-11",
  );
  assert.ok(recipe);
  assert.equal(recipe.temperature?.status, "verified");
  assert.equal(recipe.temperature?.display, "90℃ 이상");
  assert.equal(recipe.temp, "90℃ 이상");
  assert.equal(recipe.temperature?.celsius, undefined);
});
