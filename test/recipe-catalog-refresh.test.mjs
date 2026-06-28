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
  "anstar-6888",
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

test("official Anstar multi-serving video replaces the unverified 6888 label", () => {
  const current = recipe("anstar-multiserve-20g-2024");
  assert.ok(current);
  assert.equal(current.name, "안스타 2인분 HOT (2024)");
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
  assert.match(current.steps.at(-1).cue, /60~80g.*280~300g/);
});

test("2026 Jung In-sung 15g recipe keeps source facts separate from app timing", () => {
  const current = recipe("jis-484-15g-2026");
  assert.ok(current);
  assert.equal(current.sourceStatus, "partial");
  assert.equal(current.sourceUrl, "https://www.youtube.com/watch?v=Q3CbFCF5CD4");
  assert.equal(current.doseGrams, 15);
  assert.equal(current.waterGrams, 220);
  assert.equal(current.temperatureCelsius, undefined);
  assert.deepEqual(
    current.steps.map((step) => step.targetWaterGrams),
    [30, 90, 120, 220],
  );
  assert.match(current.steps[1].cue, /앱 시작 시점/);
  assert.match(current.steps[2].cue, /앱 시작 시점/);
  assert.match(current.steps.at(-1).cue, /확인된.*100g/);
});

test("Tetsu THE NEO BREW encodes ten 30g pours at 15 second intervals", () => {
  const current = recipe("tetsu-neo-2026");
  assert.ok(current);
  assert.equal(current.sourceStatus, "partial");
  assert.equal(current.sourceUrl, "https://www.youtube.com/watch?v=k0nsShguOsU");
  assert.equal(current.doseGrams, 20);
  assert.equal(current.waterGrams, 300);
  assert.equal(current.ratio, 15);
  assert.equal(current.temperatureCelsius, 96);
  assert.equal(current.steps.length, 10);
  assert.deepEqual(
    current.steps.map((step) => step.startSeconds),
    [0, 15, 30, 45, 60, 75, 90, 105, 120, 135],
  );
  assert.deepEqual(
    current.steps.map((step) => step.targetWaterGrams),
    [30, 60, 90, 120, 150, 180, 210, 240, 270, 300],
  );
  assert.match(current.grindIntent.originalDescription, /40~45클릭.*극굵은/);
});

test("catalog audit records source boundaries and superseded Clever ratio", async () => {
  const audit = await readFile(
    new URL(
      "../docs/source-audits/recipe-catalog-refresh-2026-06.md",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(audit, /40g HOT와 40g ICE의 물 온도는 모두 86℃/);
  assert.match(audit, /20g HOT의 정확한 온도/);
  assert.match(audit, /기존 앱 전사 시작값/);
  assert.match(audit, /20g\/240g, 1:12/);
  assert.match(audit, /20g\/220g, 1:11/);
  assert.match(audit, /활성 레시피는 `jis-clever-1-11`만 유지/);
});
