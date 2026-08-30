import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { baristaRecipes } from "../data/expandedBaristaRecipes.ts";
import { recipeSourceRegistry } from "../data/recipeSourceRegistry.ts";

const recipe = (id) => baristaRecipes.find((candidate) => candidate.id === id);

const removedRecipeIds = [
  "signature-cone",
  "deepblue-v60",
  "jis-4666",
  "anstar-multiserve-20g-2024",
];

test("removed and superseded public recipes are absent from catalog and registry", () => {
  for (const recipeId of removedRecipeIds) {
    assert.equal(recipe(recipeId), undefined);
    assert.equal(
      recipeSourceRegistry.some((record) => record.recipeId === recipeId),
      false,
    );
  }
});

test("canonical Anstar 6888 keeps the official multi-serving source facts", () => {
  const current = recipe("anstar-6888");
  assert.ok(current);
  assert.equal(current.name, "안스타 6888");
  assert.equal(current.sourceStatus, "partial");
  assert.equal(
    current.sourceUrl,
    "https://www.youtube.com/watch?v=uZs78TPm7ws",
  );
  assert.equal(current.doseGrams, 20);
  assert.equal(current.waterGrams, 300);
  assert.equal(current.temperatureCelsius, undefined);
  assert.deepEqual(
    current.steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [0, 60],
      [30, 140],
      [60, 220],
      [90, 300],
      [120, 300],
    ],
  );
  assert.ok(
    current.steps.slice(0, 4).every((step) =>
      step.cue.includes("기존 앱 전사 시작값"),
    ),
  );

  const source = recipeSourceRegistry.find(
    (record) => record.recipeId === current.id,
  );
  assert.ok(source);
  assert.equal(source.check, "partial");
});

test("Jung In-sung Ver 2.0 preserves the official 18g HOT structure", () => {
  const current = recipe("jis-ver2-hot");
  assert.ok(current);
  assert.equal(current.sourceStatus, "partial");
  assert.equal(current.sourceUrl, "https://www.youtube.com/watch?v=i7Q-pvahrXw");
  assert.equal(current.doseGrams, 18);
  assert.equal(current.temperatureCelsius, 90);
  assert.deepEqual(current.grindIntent.representativeMicrons, {
    min: 950,
    max: 1050,
  });
  assert.deepEqual(
    current.steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [0, 40],
      [40, 100],
      [70, 160],
      [100, 220],
      [170, 300],
    ],
  );
});

test("2026 Jung In-sung 15g recipe keeps source facts separate from app timing", () => {
  const current = recipe("jis-484-15g-2026");
  assert.ok(current);
  assert.equal(current.sourceStatus, "partial");
  assert.equal(current.doseGrams, 15);
  assert.equal(current.waterGrams, 220);
  assert.equal(current.temperatureCelsius, undefined);
  assert.deepEqual(
    current.steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [0, 30],
      [40, 90],
      [70, 120],
      [150, 220],
    ],
  );
});

test("Tetsu THE NEO BREW blooms 30 seconds, then continues at 15 second intervals", () => {
  const current = recipe("tetsu-neo-2026");
  assert.ok(current);
  assert.equal(current.sourceStatus, "partial");
  assert.equal(current.doseGrams, 20);
  assert.equal(current.waterGrams, 300);
  assert.equal(current.temperatureCelsius, 96);
  assert.equal(current.targetTimeMinSeconds, 180);
  assert.equal(current.targetTimeMaxSeconds, 210);
  assert.equal(current.steps.length, 10);
  assert.deepEqual(
    current.steps.map((step) => [step.startSeconds, step.targetWaterGrams]),
    [
      [0, 30],
      [30, 60],
      [45, 90],
      [60, 120],
      [75, 150],
      [90, 180],
      [105, 210],
      [120, 240],
      [135, 270],
      [150, 300],
    ],
  );
  assert.match(current.steps[0]?.cue ?? "", /0:30까지 뜸/);
  assert.match(current.steps.at(-1)?.cue ?? "", /2:30에 누적 300g/);
});

test("default recipe source registry page links do not include stale labels", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.ok(packageJson.scripts["validate:static-export"]);
  assert.equal(
    recipeSourceRegistry.some((record) => record.label.includes("시그니쳐")),
    false,
  );
});
