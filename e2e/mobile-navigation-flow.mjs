import assert from "node:assert/strict";

import { resetBrowserStorage, runStaticE2E } from "./helpers/static-e2e-harness.mjs";

runStaticE2E("mobile-navigation", async ({ page }) => {
  await resetBrowserStorage(page);

  const mobileNav = page.locator('nav[data-mobile-coffee-nav="true"]');
  await mobileNav.waitFor({ state: "visible" });
  for (const label of ["추천", "원두", "기록", "도구"]) {
    await mobileNav.getByRole("button", { name: label, exact: true }).waitFor();
  }

  await mobileNav.getByRole("button", { name: "원두", exact: true }).click();
  const beanDialog = page.getByRole("dialog", { name: "내 원두" });
  await beanDialog.waitFor({ state: "visible" });
  await beanDialog.getByRole("button", { name: "내 원두 닫기" }).click();
  await beanDialog.waitFor({ state: "hidden" });

  await mobileNav.getByRole("button", { name: "도구", exact: true }).click();
  const toolsDialog = page.getByRole("dialog", { name: "도구" });
  await toolsDialog.waitFor({ state: "visible" });
  for (const label of [
    "레시피 순서",
    "분쇄도 변환",
    "세부 산지",
    "개인 레시피 버전",
    "근거 현황",
  ]) {
    await toolsDialog.getByText(label, { exact: true }).waitFor();
  }

  await toolsDialog.getByRole("button").filter({ hasText: "분쇄도 변환" }).click();
  await toolsDialog.waitFor({ state: "hidden" });
  const grindDialog = page.getByRole("dialog", { name: "대표 입도 → 그라인더 설정" });
  await grindDialog.waitFor({ state: "visible" });
  await grindDialog.getByRole("button", { name: "분쇄도 변환 닫기" }).click();
  await grindDialog.waitFor({ state: "hidden" });

  const timerPanel = page.locator('[data-timer-panel="true"]');
  await timerPanel.getByRole("button", { name: "시작", exact: true }).click();
  await timerPanel.getByRole("button", { name: "일시정지", exact: true }).waitFor();
  await mobileNav.waitFor({ state: "detached" });

  await timerPanel.getByRole("button", { name: "일시정지", exact: true }).click();
  await timerPanel.getByRole("button", { name: "시작", exact: true }).waitFor();
  assert.equal(await mobileNav.count(), 0, "navigation stays hidden while brew is paused");
});
