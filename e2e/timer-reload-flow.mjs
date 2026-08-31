import assert from "node:assert/strict";

import { defaultRecipes } from "../data/defaultRecipes.ts";
import { resetBrowserStorage, runStaticE2E } from "./helpers/static-e2e-harness.mjs";

const sourceRecipe = defaultRecipes.find(({ id }) => id === "tetsu-neo-2026");
if (!sourceRecipe) throw new Error("Timer reload fixture recipe is missing");

const targetDose = 15;
const expectedWater = Math.round(sourceRecipe.water * (targetDose / sourceRecipe.dose));

runStaticE2E("timer-reload", async ({ page }) => {
  await resetBrowserStorage(page);

  await page
    .getByRole("button", { name: sourceRecipe.name, exact: false })
    .first()
    .click();
  const timerPanel = page.locator('[data-timer-panel="true"]');
  const doseInput = timerPanel.locator('[data-timer-dose-input="true"]');
  await doseInput.fill(String(targetDose));
  await doseInput.press("Enter");
  await timerPanel.getByRole("button", { name: "시작", exact: true }).click();
  await timerPanel.getByRole("button", { name: "일시정지", exact: true }).waitFor();

  await page.waitForTimeout(1200);
  await page.reload({ waitUntil: "networkidle" });

  const restoredTimer = page.locator('[data-timer-panel="true"]');
  await restoredTimer.getByRole("button", { name: "일시정지", exact: true }).waitFor();
  assert.equal(
    await restoredTimer.locator('[data-timer-dose-input="true"]').inputValue(),
    String(targetDose),
    "selected dose must survive reload",
  );
  await restoredTimer.getByText(`${expectedWater}g`, { exact: true }).first().waitFor();
  const elapsedText = await restoredTimer.locator("strong.font-mono").first().textContent();
  assert.notEqual(elapsedText?.trim(), "0:00", "running timer must survive reload");
});
