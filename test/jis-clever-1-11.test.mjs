import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { baristaRecipes } from "../data/expandedBaristaRecipes.ts";
import { recipeSourceRegistry } from "../data/recipeSourceRegistry.ts";
import {
  rankBaristaRecipes,
  selectBaristaRecipe,
} from "../lib/recommendation/baristaRecipeMatcher.ts";
import {
  applyCleverRecommendationProfile,
  cleverLoadingOrder,
  cleverTiming,
} from "../lib/recommendation/cleverRecommendation.ts";

const recipe = baristaRecipes.find(
  (candidate) => candidate.id === "jis-clever-1-11",
);

const grinder = {
  id: "grinder-1",
  model: "1zpresso-k-ultra",
  displayName: "K-Ultra",
  calibrationProfile: "user-zero",
  calibrationLabel: "사용자 영점",
  calibrationStatus: "user-calibrated",
  recommendationStatus: "primary",
  displayUnit: "dial",
  adjustmentDirection: "higher-is-coarser",
  displayStep: 0.1,
  personalOffset: 0,
  notes: [],
  isBuiltIn: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const input = {
  bean: {
    id: "bean-1",
    name: "브라질 내추럴",
    originCountry: "brazil",
    originGroup: "brazil",
    roastLevel: "medium-light",
    process: "natural",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  grinder,
  preferences: {
    defaultBrewer: "clever",
    defaultDoseGrams: 20,
    defaultWaterGrams: 220,
    defaultDrinkStyle: "hot",
    defaultGrinderProfileId: grinder.id,
    defaultTasteGoal: "body",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  tasteGoal: "body",
};

test("Jung In-sung Clever recipe keeps only first-party confirmed values", () => {
  assert.ok(recipe);
  assert.equal(recipe.sourceStatus, "partial");
  assert.equal(recipe.doseGrams, 20);
  assert.equal(recipe.waterGrams, 220);
  assert.equal(recipe.ratio, 11);
  assert.equal(recipe.temperatureCelsius, undefined);
  assert.equal(cleverLoadingOrder(recipe), "coffee-first");
  assert.deepEqual(cleverTiming(recipe), {
    immersionSeconds: 150,
    drawdownMinSeconds: 50,
    drawdownMaxSeconds: 70,
    totalMinSeconds: 200,
    totalMaxSeconds: 220,
  });
  assert.match(recipe.steps[0].cue, /40g.*바로 스푼/);
  assert.match(recipe.steps[2].cue, /1:00/);
  assert.match(recipe.steps[3].cue, /2:30.*3:20~3:40/);
  assert.match(recipe.steps[4].cue, /80~100g.*300~320g/);
});

test("source registry keeps the latest Clever video separate from current V60 recipes", () => {
  const source = recipeSourceRegistry.find(
    (record) => record.recipeId === "jis-clever-1-11",
  );
  assert.ok(source);
  assert.equal(source.check, "partial");
  assert.equal(
    source.url,
    "https://www.youtube.com/watch?v=JWHanqQ5MsQ",
  );

  const v60Source = recipeSourceRegistry.find(
    (record) => record.recipeId === "jis-ver2-hot",
  );
  assert.ok(v60Source);
  assert.equal(v60Source.check, "partial");
  assert.equal(
    v60Source.url,
    "https://www.youtube.com/watch?v=i7Q-pvahrXw",
  );
  assert.equal(
    recipeSourceRegistry.some((record) => record.recipeId === "jis-4666"),
    false,
  );
});

test("body and sweet goals prefer 1:11 while balanced official dose prefers official", () => {
  assert.equal(
    selectBaristaRecipe({
      brewerType: "clever",
      drinkStyle: "hot",
      roastLevel: "medium-light",
      process: "natural",
      tasteGoal: "body",
      doseGrams: 20,
      originCountry: "brazil",
      originGroup: "brazil",
      flavorNotes: ["단맛", "묵직"],
    })?.recipe.id,
    "jis-clever-1-11",
  );
  assert.equal(
    selectBaristaRecipe({
      brewerType: "clever",
      drinkStyle: "hot",
      roastLevel: "medium",
      process: "honey",
      tasteGoal: "sweet",
      doseGrams: 20,
      originCountry: "colombia",
      originGroup: "latin-america",
    })?.recipe.id,
    "jis-clever-1-11",
  );
  assert.equal(
    selectBaristaRecipe({
      brewerType: "clever",
      drinkStyle: "hot",
      roastLevel: "medium",
      process: "washed",
      tasteGoal: "balanced",
      doseGrams: 18.5,
    })?.recipe.id,
    "clever-official-distributor-185",
  );
});

test("stable personal history can promote 1:11 without forcing every balanced user", () => {
  const query = {
    brewerType: "clever",
    drinkStyle: "hot",
    roastLevel: "medium",
    process: "washed",
    tasteGoal: "balanced",
    doseGrams: 18.5,
  };
  const baseline = rankBaristaRecipes(query, 3);
  assert.equal(baseline[0].recipe.id, "clever-official-distributor-185");

  const personalized = rankBaristaRecipes(
    {
      ...query,
      personalRecipeStatuses: { "jis-clever-1-11": "stable" },
    },
    3,
  );
  assert.equal(personalized[0].recipe.id, "jis-clever-1-11");
  assert.ok(
    personalized[0].reasons.some((reason) => reason.startsWith("[개인 성공]")),
  );
});

test("profile preserves partial source procedure and labels app conversion values", () => {
  assert.ok(recipe);
  const result = applyCleverRecommendationProfile(
    {
      templateName: recipe.name,
      sourceRecipeId: recipe.id,
      sourceStatus: recipe.sourceStatus,
      doseGrams: 20,
      waterGrams: 220,
      ratio: 11,
      temperatureCelsius: 94,
      targetTimeMinSeconds: 200,
      targetTimeMaxSeconds: 220,
      grinder: {
        displayValue: "7.2",
        displayRange: "6.5~8.0",
        commonDescription: "중굵게",
        calibrationLabel: "사용자 영점",
        safeRangeLabel: "5.0~10.0",
        isNumeric: true,
        note: "앱 변환 시작값",
      },
      steps: recipe.steps,
      reasons: [],
      confidence: "reference",
      confidenceReason: "참고",
      appliedRules: [],
    },
    recipe,
    input,
  );
  assert.equal(result.ratio, 11);
  assert.equal(result.waterGrams, 220);
  assert.equal(result.temperatureCelsius, 94);
  assert.deepEqual(
    [result.targetTimeMinSeconds, result.targetTimeMaxSeconds],
    [200, 220],
  );
  assert.match(result.steps[0].cue, /40g.*바로 스푼/);
  assert.match(result.grinder.note, /원본 분쇄 문구와 별개/);
  assert.ok(result.reasons.some((reason) => reason.startsWith("[부분 검증 원본]")));
  assert.ok(result.reasons.some((reason) => reason.startsWith("[원본과 앱 조정 분리]")));
  assert.ok(result.reasons.some((reason) => reason.startsWith("[클레버 분쇄")));
  assert.equal(result.confidence, "reference");
  assert.match(result.confidenceReason, /partial\/reference/);
  assert.ok(
    result.appliedRules.some((rule) =>
      rule.evidence.some(
        (evidence) =>
          evidence.kind === "expert" && evidence.applicability === "partial",
      ),
    ),
  );
});

test("source audit documents verified, unverified and scaling boundaries", async () => {
  const audit = await readFile(
    new URL("../docs/source-audits/jis-clever-1-11.md", import.meta.url),
    "utf8",
  );
  assert.match(audit, /상태: `partial`/);
  assert.match(audit, /원본 미확인/);
  assert.match(audit, /추출수: `D × 11`/);
  assert.match(audit, /HOT 후가수: `D × 4~5`/);
  assert.match(audit, /K-Ultra/);
});
