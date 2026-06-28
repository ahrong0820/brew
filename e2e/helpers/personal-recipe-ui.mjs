import assert from "node:assert/strict";

function storedProfiles(page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("brew.beanBrewProfiles.v1") || "null"),
  );
}

function jisPersonalRecipe(profiles) {
  return profiles?.items?.find(
    (profile) => profile.sourceRecipeId === "jis-clever-1-11",
  )?.personalRecipe;
}

export async function assertStablePersonalRecipe(page) {
  const personal = jisPersonalRecipe(await storedProfiles(page));
  assert.equal(personal?.status, "stable");
  assert.equal(personal?.version, 2);
  assert.equal(personal?.versions?.length, 2);
}

export async function restoreFirstPersonalRecipeVersion(page) {
  const nav = page.locator('nav[data-mobile-coffee-nav="true"]');
  await nav.waitFor({ state: "visible" });
  await nav.getByRole("button", { name: "도구", exact: true }).click();
  const tools = page.getByRole("dialog", { name: "도구" });
  await tools.waitFor({ state: "visible" });
  await tools
    .getByRole("button", { name: /개인 레시피 버전/ })
    .click();

  const dialog = page.getByRole("dialog", { name: "개인 레시피 버전" });
  await dialog.waitFor({ state: "visible" });
  await dialog.getByText("안정 개인 성공", { exact: true }).waitFor();
  await dialog.getByText("v2", { exact: true }).first().waitFor();
  await dialog
    .locator('button:has-text("복원"):not([disabled])')
    .first()
    .click();
  await dialog
    .getByText("개인 레시피 v1을 현재 베스트로 복원했습니다.", {
      exact: true,
    })
    .waitFor();

  const restored = jisPersonalRecipe(await storedProfiles(page));
  assert.equal(restored?.version, 1);
  assert.equal(restored?.versions?.length, 2);
}
