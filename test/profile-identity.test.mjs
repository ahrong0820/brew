import assert from "node:assert/strict";
import test from "node:test";

import {
  brewProfileIdentityKey,
  matchesBrewProfileIdentity,
  normalizeDrinkStyle,
} from "../lib/brew/profileIdentity.ts";

const baseIdentity = {
  beanId: "bean-1",
  brewerType: "v60",
  grinderProfileId: "grinder-1",
  tasteGoal: "balanced",
};

test("legacy profiles without drink style are treated as HOT", () => {
  assert.equal(normalizeDrinkStyle(undefined), "hot");
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
