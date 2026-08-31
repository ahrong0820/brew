import assert from "node:assert/strict";

import { resetBrowserStorage, runStaticE2E } from "./helpers/static-e2e-harness.mjs";

const customRecipeName = "E2E 사용자 레시피";

runStaticE2E("custom-recipe", async ({ page }) => {
  await resetBrowserStorage(page);

  const customSection = page.locator('[data-custom-editor-open]');
  await customSection.waitFor({ state: "visible" });
  assert.equal(await customSection.getAttribute("data-custom-editor-open"), "false");

  await customSection
    .getByRole("button", { name: "＋ 나만의 레시피 만들기", exact: true })
    .click();
  assert.equal(await customSection.getAttribute("data-custom-editor-open"), "true");
  await customSection.getByLabel("레시피 이름").fill(customRecipeName);
  await customSection.getByRole("button", { name: "레시피 저장", exact: true }).click();

  assert.equal(await customSection.getAttribute("data-custom-editor-open"), "false");
  await page
    .getByRole("button", { name: customRecipeName, exact: false })
    .first()
    .waitFor({ state: "visible" });

  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: customRecipeName, exact: false })
    .first()
    .waitFor({ state: "visible" });

  await customSection
    .getByRole("button", { name: "＋ 나만의 레시피 만들기", exact: true })
    .click();
  await customSection
    .getByRole("button", { name: `${customRecipeName} 삭제`, exact: true })
    .click();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.getByRole("button", { name: customRecipeName, exact: false }).count(),
    0,
  );
});
