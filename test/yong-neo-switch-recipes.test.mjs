import assert from "node:assert/strict";
import test from "node:test";

import { defaultRecipes } from "../data/defaultRecipes.ts";
import { baristaRecipes } from "../data/expandedBaristaRecipes.ts";
import { recipeSourceRegistry } from "../data/recipeSourceRegistry.ts";

const defaultRecipe = (id) => defaultRecipes.find((recipe) => recipe.id === id);
const baristaRecipe = (id) => baristaRecipes.find((recipe) => recipe.id === id);

test("YongChamp neo switch HOT default recipe preserves official display and actual water amounts", () => {
  const recipe = defaultRecipe("yong-neo-reverse-switch-hot");
  assert.ok(recipe);
  assert.equal(recipe.name, "용챔 15g 네오스위치 HOT");
  assert.equal(recipe.dose, 15);
  assert.equal(recipe.water, 230);
  assert.equal(recipe.finalWater, 240);
  assert.equal(recipe.temp, "92℃");
  assert.equal(recipe.totalTime, 240);
  assert.deepEqual(
    recipe.steps.map((step) => [
      step.start,
      step.targetWater,
      step.displayTargetWater ?? step.targetWater,
    ]),
    [
      [0, 30, 30],
      [30, 30, 0],
      [60, 60, 30],
      [90, 60, 30],
      [100, 170, 140],
      [150, 230, 200],
      [160, 230, 200],
      [210, 230, 200],
    ],
  );
});

test("YongChamp neo switch ICE default recipe preserves official display and actual water amounts", () => {
  const recipe = defaultRecipe("yong-neo-reverse-switch-ice");
  assert.ok(recipe);
  assert.equal(recipe.name, "용챔 15g 네오스위치 ICE");
  assert.equal(recipe.dose, 15);
  assert.equal(recipe.water, 150);
  assert.equal(recipe.ratio, "1:10");
  assert.equal(recipe.temp, "92℃");
  assert.equal(recipe.totalTime, 210);
  assert.deepEqual(
    recipe.steps.map((step) => [
      step.start,
      step.targetWater,
      step.displayTargetWater ?? step.targetWater,
    ]),
    [
      [0, 30, 30],
      [30, 30, 0],
      [60, 60, 30],
      [90, 60, 30],
      [100, 120, 90],
      [135, 150, 120],
      [150, 150, 120],
      [195, 150, 120],
    ],
  );
});

test("YongChamp neo switch recipes are available in the recommendation catalog with official sources", () => {
  const hot = baristaRecipe("yong-neo-reverse-switch-hot");
  const ice = baristaRecipe("yong-neo-reverse-switch-ice");
  assert.ok(hot);
  assert.ok(ice);
  assert.equal(hot.sourceStatus, "verified");
  assert.equal(ice.sourceStatus, "verified");
  assert.equal(hot.brewerType, "switch");
  assert.equal(ice.drinkStyle, "iced");
  assert.deepEqual(
    hot.steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [0, 30],
      [30, 30],
      [60, 60],
      [90, 60],
      [100, 170],
      [150, 230],
      [160, 230],
    ],
  );
  assert.deepEqual(
    ice.steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [0, 30],
      [30, 30],
      [60, 60],
      [90, 60],
      [100, 120],
      [135, 150],
      [150, 150],
    ],
  );

  assert.equal(
    recipeSourceRegistry.find((record) => record.recipeId === hot.id)?.url,
    "https://www.youtube.com/watch?v=8JD__5hwN0M",
  );
  assert.equal(
    recipeSourceRegistry.find((record) => record.recipeId === ice.id)?.url,
    "https://www.youtube.com/watch?v=h_Y2D7Fppgw",
  );
});
