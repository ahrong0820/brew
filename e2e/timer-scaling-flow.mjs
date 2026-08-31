import assert from "node:assert/strict";

import { defaultRecipes } from "../data/defaultRecipes.ts";
import { resetBrowserStorage, runStaticE2E } from "./helpers/static-e2e-harness.mjs";

const sourceRecipe = defaultRecipes.find(({ id }) => id === "tetsu-neo-2026");
if (!sourceRecipe) throw new Error("Timer scaling fixture recipe is missing");

const targetDose = 15;
const factor = targetDose / sourceRecipe.dose;
const expectedWater = Math.round(sourceRecipe.water * factor);
const expectedFinalTarget = Math.round(sourceRecipe.steps.at(-1).targetWater * factor);

runStaticE2E("timer-scaling", async ({ page }) => {
  await resetBrowserStorage(page);

  const timerPanel = page.locator('[data-timer-panel="true"]');
  const doseInput = timerPanel.locator('[data-timer-dose-input="true"]');
  await doseInput.waitFor({ state: "visible" });

  await doseInput.fill("");
  assert.equal(await doseInput.inputValue(), "", "blank dose stays editable");

  await doseInput.fill("4");
  assert.equal(await doseInput.inputValue(), "4", "partial low dose stays editable");
  await doseInput.press("Tab");
  await page.waitForTimeout(50);
  assert.equal(await doseInput.inputValue(), "8", "low dose clamps on commit");

  await doseInput.focus();
  await doseInput.fill("45");
  assert.equal(await doseInput.inputValue(), "45", "partial high dose stays editable");
  await doseInput.press("Tab");
  await page.waitForTimeout(50);
  assert.equal(await doseInput.inputValue(), "40", "high dose clamps on commit");

  await page
    .getByRole("button", { name: sourceRecipe.name, exact: false })
    .first()
    .click();
  await doseInput.fill(String(targetDose));
  await doseInput.press("Enter");
  await timerPanel.getByText(`${expectedWater}g`, { exact: true }).first().waitFor();

  await timerPanel.getByRole("button", { name: "시작", exact: true }).click();
  await timerPanel.getByRole("button", { name: "일시정지", exact: true }).waitFor();
  assert.equal(await doseInput.inputValue(), String(targetDose));

  const activeClock = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("brew.activeRecommendationSession.v1") || "null"),
  );
  assert.equal(activeClock.recipe.id, sourceRecipe.id);
  assert.equal(activeClock.recipe.dose, targetDose);
  assert.equal(activeClock.recipe.water, expectedWater);
  assert.equal(activeClock.recipe.steps.at(-1).targetWater, expectedFinalTarget);
});
