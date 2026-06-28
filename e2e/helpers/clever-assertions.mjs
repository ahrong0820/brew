export async function assertOfficialClever(dialog) {
  await dialog
    .getByRole("heading", {
      name: "클레버 공식 유통 레시피 18.5g",
      exact: true,
    })
    .waitFor();
  await dialog.getByText("공식·검증", { exact: true }).waitFor();
  await dialog.getByText("18.5g / 310g", { exact: true }).waitFor();
  await dialog.getByText("1:16.75", { exact: true }).waitFor();
  await dialog.getByText("100℃", { exact: true }).waitFor();
}

export async function assertJisClever(dialog) {
  await dialog
    .getByRole("heading", { name: "정인성 Clever 1:11", exact: true })
    .waitFor();
  await dialog.getByText("20g / 220g", { exact: true }).waitFor();
  await dialog.getByText("1:11", { exact: true }).waitFor();
  await dialog.getByText("92℃", { exact: true }).waitFor();
  await dialog.getByText(/\[부분 검증 원본\]/).waitFor({ state: "attached" });
  await dialog
    .getByText(/\[원본과 앱 조정 분리\]/)
    .waitFor({ state: "attached" });
  await dialog.getByText("신뢰도 참고", { exact: true }).waitFor();
}

export async function startRecommendationTimer(dialog) {
  await dialog
    .getByRole("button", {
      name: "이 레시피로 타이머 시작",
      exact: true,
    })
    .click();
}
