import assert from "node:assert/strict";
import test from "node:test";

import { rankBaristaRecipes } from "../lib/recommendation/baristaRecipeMatcher.ts";
import { recommendationReasonCategory } from "../lib/recommendation/presentation.ts";

const baseInput = {
  brewerType: "v60",
  drinkStyle: "hot",
  roastLevel: "light",
  process: "washed",
  tasteGoal: "bright",
  doseGrams: 20,
  flavorNotes: [],
};

test("missing origin and variety metadata preserves the existing ranking", () => {
  const baseline = rankBaristaRecipes(baseInput, 6).map((match) => ({
    id: match.recipe.id,
    score: match.score,
  }));
  const explicitMissing = rankBaristaRecipes(
    {
      ...baseInput,
      originCountry: undefined,
      originGroup: undefined,
      originRegions: undefined,
      variety: undefined,
    },
    6,
  ).map((match) => ({ id: match.recipe.id, score: match.score }));

  assert.deepEqual(explicitMissing, baseline);
});

test("East African Geisha metadata adds origin and variety evidence", () => {
  const baseline = rankBaristaRecipes(baseInput, 6).find(
    (match) => match.recipe.id === "jis-4666",
  );
  const connected = rankBaristaRecipes(
    {
      ...baseInput,
      originCountry: "ethiopia",
      originGroup: "east-africa",
      originRegions: ["Guji"],
      variety: "Geisha",
    },
    6,
  ).find((match) => match.recipe.id === "jis-4666");

  assert.ok(baseline);
  assert.ok(connected);
  assert.ok(connected.score >= baseline.score);
  assert.ok(
    connected.reasons.some(
      (reason) => recommendationReasonCategory(reason) === "산지 연결",
    ),
  );
  assert.ok(
    connected.reasons.some(
      (reason) => recommendationReasonCategory(reason) === "품종 연결",
    ),
  );
});

test("Latin American Bourbon metadata connects to sweet balanced recipes", () => {
  const matches = rankBaristaRecipes(
    {
      ...baseInput,
      roastLevel: "medium-light",
      tasteGoal: "balanced",
      doseGrams: 15,
      originCountry: "colombia",
      originGroup: "latin-america",
      variety: "Pink Bourbon",
    },
    6,
  );
  const connected = matches.find((match) => match.recipe.id === "deepblue-v60");

  assert.ok(connected);
  assert.ok(connected.reasons.some((reason) => reason.startsWith("[산지 연결]")));
  assert.ok(connected.reasons.some((reason) => reason.startsWith("[품종 연결]")));
});
