import { field } from "./recommendation-ui.mjs";

export async function registerBrazilWashedBean(page, name) {
  await page.getByRole("button", { name: /내 원두 열기/ }).click();
  const dialog = page.getByRole("dialog", { name: "내 원두" });
  await dialog.waitFor({ state: "visible" });
  await dialog
    .getByRole("button", { name: "첫 원두 등록", exact: true })
    .click();
  await field(dialog, "원두 이름", "input").fill(name);
  await field(dialog, "산지", "select").selectOption("brazil");
  await field(dialog, "배전도", "select").selectOption("medium");
  await field(dialog, "가공 방식", "select").selectOption("washed");
  await dialog.getByRole("button", { name: "원두 저장", exact: true }).click();
  await dialog.getByText(name, { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "내 원두 닫기" }).click();
}

export async function verifyPersistedBean(page, name) {
  await page.getByRole("button", { name: /내 원두 열기/ }).click();
  const dialog = page.getByRole("dialog", { name: "내 원두" });
  await dialog.getByText(name, { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "내 원두 닫기" }).click();
}
