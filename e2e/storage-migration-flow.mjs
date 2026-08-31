import assert from "node:assert/strict";

import {
  defaultRecipeIdAliases,
  removedDefaultRecipeIds,
} from "../lib/recipes/defaultRecipeCatalog.ts";
import { runStaticE2E } from "./helpers/static-e2e-harness.mjs";

const aliasFixture = Object.entries(defaultRecipeIdAliases)[0];
const removedProfileRecipeId = removedDefaultRecipeIds.at(-1);

if (!aliasFixture || !removedProfileRecipeId) {
  throw new Error("Default recipe migration fixtures are missing from the registry");
}

const [aliasSourceRecipeId, aliasTargetRecipeId] = aliasFixture;

const validCustomRecipe = {
  id: "custom-7",
  name: "E2E 저장 레시피",
  origin: "나만의 레시피",
  method: "V60",
  profile: "브라우저 복원 확인",
  tags: ["나만의 레시피", "V60"],
  dose: 20,
  water: 300,
  ratio: "1:15",
  temp: "92℃",
  grind: "중간 분쇄",
  totalTime: 60,
  notes: ["E2E"],
  steps: [
    {
      label: "전체 추출",
      start: 0,
      end: 60,
      targetWater: 300,
      cue: "60초 동안 추출",
    },
  ],
};

runStaticE2E("storage-migration", async ({ page }) => {
  await page.evaluate(
    ({ customRecipe, aliasSourceRecipeId, removedProfileRecipeId }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("coffee-recipe-favorites", "{malformed-json");
      localStorage.setItem(
        "coffee-custom-recipes",
        JSON.stringify([
          customRecipe,
          {
            id: "custom-broken",
            name: "손상 레시피",
            dose: 0,
            water: -1,
            totalTime: -20,
            tags: [],
            notes: [],
            steps: [{}],
          },
        ]),
      );
      localStorage.setItem(
        "brew.beanBrewProfiles.v1",
        JSON.stringify({
          version: 1,
          updatedAt: "2026-07-10T00:00:00.000Z",
          items: [
            { id: "profile-alias", sourceRecipeId: aliasSourceRecipeId },
            { id: "profile-stale", sourceRecipeId: removedProfileRecipeId },
          ],
        }),
      );
    },
    { customRecipe: validCustomRecipe, aliasSourceRecipeId, removedProfileRecipeId },
  );
  await page.reload({ waitUntil: "networkidle" });

  await page.getByText("E2E 저장 레시피", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("손상 레시피", { exact: true }).count(), 0);

  const storageState = await page.evaluate(() => ({
    favorites: localStorage.getItem("coffee-recipe-favorites"),
    custom: JSON.parse(localStorage.getItem("coffee-custom-recipes") || "[]"),
    quarantine: JSON.parse(
      localStorage.getItem("coffee-custom-recipes-quarantine.v1") || "[]",
    ),
    profiles: JSON.parse(localStorage.getItem("brew.beanBrewProfiles.v1") || "null"),
  }));

  assert.deepEqual(JSON.parse(storageState.favorites || "[]"), []);
  assert.deepEqual(storageState.custom.map((recipe) => recipe.id), ["custom-7"]);
  assert.ok(storageState.quarantine.length >= 1, "invalid custom recipe must be quarantined");
  assert.equal(storageState.profiles.items[0].sourceRecipeId, aliasTargetRecipeId);
  assert.equal("sourceRecipeId" in storageState.profiles.items[1], false);
});
