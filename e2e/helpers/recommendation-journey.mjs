import assert from "node:assert/strict";
import { registerBrazilWashedBean, verifyPersistedBean } from "./bean-ui.mjs";
import {
  assertJisClever,
  assertOfficialClever,
  startRecommendationTimer,
} from "./clever-assertions.mjs";
import { saveSuccessfulFeedback } from "./feedback-ui.mjs";
import {
  assertStablePersonalRecipe,
  restoreFirstPersonalRecipeVersion,
} from "./personal-recipe-ui.mjs";
import { openRecommendation, setRecommendation } from "./recommendation-ui.mjs";

const beanName = "E2E 브라질 워시드";

export async function runRecommendationJourney(page) {
  await registerBrazilWashedBean(page, beanName);
  const storedBeans = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("brew.beans.v1") || "null"),
  );
  assert.equal(storedBeans?.items?.[0]?.name, beanName);

  await page.reload({ waitUntil: "networkidle" });
  await verifyPersistedBean(page, beanName);

  let dialog = await openRecommendation(page);
  await setRecommendation(dialog, 18.5, "밸런스");
  await assertOfficialClever(dialog);

  await setRecommendation(dialog, 20, "바디감");
  await assertJisClever(dialog);
  await startRecommendationTimer(dialog);
  await saveSuccessfulFeedback(page);

  dialog = await openRecommendation(page);
  await setRecommendation(dialog, 20, "바디감");
  await assertJisClever(dialog);
  await dialog.getByText("개인 성공 · 잠정", { exact: true }).waitFor();
  await dialog
    .getByText(/\[개인 성공\]/)
    .first()
    .waitFor({ state: "attached" });
  await startRecommendationTimer(dialog);
  await saveSuccessfulFeedback(page);

  await assertStablePersonalRecipe(page);
  await restoreFirstPersonalRecipeVersion(page);
}
