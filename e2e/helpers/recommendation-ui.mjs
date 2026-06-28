export function field(dialog, text, selector) {
  return dialog.locator("label").filter({ hasText: text }).locator(selector).first();
}

export async function openRecommendation(page) {
  await page.getByRole("button", { name: "맞춤 추천", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "원두 맞춤 추천" });
  await dialog.waitFor({ state: "visible" });
  return dialog;
}

export async function setRecommendation(dialog, dose, taste) {
  const doseInput = field(dialog, "원두량(g)", "input");
  await doseInput.fill(String(dose));
  await doseInput.press("Tab");
  await field(dialog, "드리퍼", "select").selectOption("clever");
  await field(dialog, "음용 방식", "select").selectOption("hot");
  await dialog.getByRole("button", { name: new RegExp(`^${taste}`) }).click();
  await dialog.getByRole("button", { name: "추천 만들기", exact: true }).click();
}
