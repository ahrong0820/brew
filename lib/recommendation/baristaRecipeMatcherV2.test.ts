import assert from "node:assert/strict";
import test from "node:test";
import { rankBaristaRecipes, selectBaristaRecipe } from "./baristaRecipeMatcherV2.ts";

test("barista recipe matcher exposes 안스타 6888 with the canonical default UI id", () => {
  const matches = rankBaristaRecipes(
    {
      brewerType: "v60",
      drinkStyle: "hot",
      roastLevel: "medium-light",
      process: "washed",
      tasteGoal: "balanced",
      doseGrams: 20,
    },
    20,
  );
  const ids = matches.map((match) => match.recipe.id);

  assert.equal(ids.includes("anstar-6888"), true);
  assert.equal(ids.includes("anstar-multiserve-20g-2024"), false);
});

test("clever sweet recommendation can select 정인성 Clever 1:11 without bypassing the catalog", () => {
  const match = selectBaristaRecipe({
    brewerType: "clever",
    drinkStyle: "hot",
    roastLevel: "medium-light",
    process: "washed",
    tasteGoal: "sweet",
    doseGrams: 20,
  });

  assert.equal(match?.recipe.id, "jis-clever-1-11");
});
