import assert from "node:assert/strict";
import test from "node:test";

import { defaultRecipes } from "../data/defaultRecipes.ts";
import { filterRecipes } from "../lib/recipes/filterRecipes.ts";

test("recipe catalog filtering keeps query, tag and favorites independent", () => {
  const recipes = defaultRecipes;
  const first = recipes[0];

  assert.deepEqual(
    filterRecipes(recipes, {
      query: first.name,
      filter: "전체",
      favoriteIds: [],
    }).map((recipe) => recipe.id),
    [first.id],
  );

  const v60 = filterRecipes(recipes, {
    query: "",
    filter: "V60",
    favoriteIds: [],
  });
  assert.ok(v60.length > 0);
  assert.ok(v60.every((recipe) => recipe.tags.some((tag) => tag.toLowerCase() === "v60")));

  const favorites = filterRecipes(recipes, {
    query: "",
    filter: "즐겨찾기",
    favoriteIds: [first.id],
  });
  assert.deepEqual(favorites.map((recipe) => recipe.id), [first.id]);
});
