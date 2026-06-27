import assert from "node:assert/strict";
import test from "node:test";

import {
  brewProfileIdentityKey,
  matchesBrewProfileIdentity,
  normalizeDrinkStyle,
  normalizeSourceRecipeId,
} from "../lib/brew/profileIdentity.ts";

const baseIdentity = {
  beanId: "bean-1",
  brewerType: "v60",
  grinderProfileId: "grinder-1",
  tasteGoal: "balanced",
};

test("legacy profiles without drink style are treated as HOT", () => {
  assert.equal(normalizeDrinkStyle(undefined), "hot");
  assert.equal(normalizeDrinkStyle("unknown"), "hot");
  assert.equal(
    brewProfileIdentityKey(baseIdentity),
    brewProfileIdentityKey({ ...baseIdentity, drinkStyle: "hot" }),
  );
});

test("HOT and ICED use distinct personalization identities", () => {
  const hot = { ...baseIdentity, drinkStyle: "hot" };
  const iced = { ...baseIdentity, drinkStyle: "iced" };

  assert.notEqual(brewProfileIdentityKey(hot), brewProfileIdentityKey(iced));
  assert.equal(matchesBrewProfileIdentity(hot, iced), false);
  assert.equal(matchesBrewProfileIdentity(iced, { ...iced }), true);
});

test("legacy profiles remain in a separate recipe scope", () => {
  assert.equal(normalizeSourceRecipeId(undefined), "legacy-default");
  assert.equal(normalizeSourceRecipeId(""), "legacy-default");
  assert.equal(normalizeSourceRecipeId(" jis-4666 "), "jis-4666");

  const legacy = { ...baseIdentity, drinkStyle: "hot" };
  const selectedRecipe = {
    ...legacy,
    sourceRecipeId: "jis-4666",
  };

  assert.notEqual(
    brewProfileIdentityKey(legacy),
    brewProfileIdentityKey(selectedRecipe),
  );
  assert.equal(matchesBrewProfileIdentity(legacy, selectedRecipe), false);
});

test("different barista recipes do not share personalization profiles", () => {
  const recipeA = {
    ...baseIdentity,
    drinkStyle: "hot",
    sourceRecipeId: "jis-4666",
  };
  const recipeB = {
    ...baseIdentity,
    drinkStyle: "hot",
    sourceRecipeId: "tetsu-46",
  };

  assert.equal(matchesBrewProfileIdentity(recipeA, recipeB), false);
  assert.equal(matchesBrewProfileIdentity(recipeA, { ...recipeA }), true);
});
