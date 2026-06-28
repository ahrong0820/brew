export async function saveSuccessfulFeedback(page) {
  const finish = page.getByRole("button", { name: "추출 완료", exact: true });
  await finish.waitFor({ state: "visible" });
  await finish.click();

  const dialog = page.getByRole("dialog", { name: "추출 결과 기록" });
  await dialog.waitFor({ state: "visible" });
  await dialog.getByRole("button", { name: /^적정/ }).click();
  await dialog.getByRole("button", { name: /^좋음/ }).click();
  await dialog.getByRole("button", { name: "평가 저장", exact: true }).click();
  await dialog
    .getByText("추출 속도와 맛 평가를 저장했습니다.", { exact: true })
    .waitFor();
  await dialog.waitFor({ state: "hidden", timeout: 5_000 });
}
