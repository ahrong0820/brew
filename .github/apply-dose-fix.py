from pathlib import Path

page_path = Path("app/page.tsx")
page = page_path.read_text(encoding="utf-8")

import_anchor = 'import { recipeTemperaturePresentation } from "@/lib/recipes/recipeTemperature";\n'
import_replacement = (
    import_anchor
    + 'import { scaleRecipeDose } from "@/lib/recipes/scaleRecipeDose";\n'
)
if 'scaleRecipeDose' not in page:
    if import_anchor not in page:
        raise SystemExit("page import anchor not found")
    page = page.replace(import_anchor, import_replacement, 1)

start_call = 'startBrewSessionClock({ recipe: selectedRecipe }, now);'
replacement_call = (
    'startBrewSessionClock(\n'
    '        { recipe: scaleRecipeDose(selectedRecipe, dose) },\n'
    '        now,\n'
    '      );'
)
start_count = page.count(start_call)
if start_count not in (0, 2):
    raise SystemExit(f"expected two unscaled start calls, found {start_count}")
page = page.replace(start_call, replacement_call)
page_path.write_text(page, encoding="utf-8")

flow_path = Path("e2e/catalog-storage-timer-flow.mjs")
flow = flow_path.read_text(encoding="utf-8")
old_flow = '''    const timerPanel = page.locator('[data-timer-panel="true"]');
    await timerPanel.waitFor({ state: "visible" });
    await timerPanel.getByRole("button", { name: "시작", exact: true }).click();
    await timerPanel.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "networkidle" });

    const restoredTimer = page.locator('[data-timer-panel="true"]');
    await restoredTimer.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    const elapsedText = await restoredTimer.locator("strong.font-mono").first().textContent();
    assert.notEqual(elapsedText?.trim(), "0:00", "running timer must survive a reload");
    await page.getByText("E2E 저장 레시피", { exact: true }).first().waitFor();
'''
new_flow = '''    await page
      .getByRole("button", { name: "테츠 카스야 THE NEO BREW 2026", exact: false })
      .first()
      .click();

    const timerPanel = page.locator('[data-timer-panel="true"]');
    await timerPanel.waitFor({ state: "visible" });
    const doseInput = timerPanel.locator('[data-timer-dose-input="true"]');
    await doseInput.fill("15");
    await doseInput.press("Enter");
    await timerPanel.getByText("225g", { exact: true }).waitFor();

    await timerPanel.getByRole("button", { name: "시작", exact: true }).click();
    await timerPanel.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    assert.equal(await doseInput.inputValue(), "15", "starting must preserve the selected dose");

    const activeClock = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("brew.activeRecommendationSession.v1") || "null"),
    );
    assert.equal(activeClock.recipe.id, "tetsu-neo-2026");
    assert.equal(activeClock.recipe.dose, 15);
    assert.equal(activeClock.recipe.water, 225);
    assert.equal(activeClock.recipe.steps.at(-1).targetWater, 225);

    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "networkidle" });

    const restoredTimer = page.locator('[data-timer-panel="true"]');
    await restoredTimer.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    assert.equal(
      await restoredTimer.locator('[data-timer-dose-input="true"]').inputValue(),
      "15",
      "the selected dose must survive a reload",
    );
    await restoredTimer.getByText("225g", { exact: true }).waitFor();
    const elapsedText = await restoredTimer.locator("strong.font-mono").first().textContent();
    assert.notEqual(elapsedText?.trim(), "0:00", "running timer must survive a reload");
    await page.getByText("E2E 저장 레시피", { exact: true }).first().waitFor();
'''
if old_flow in flow:
    flow = flow.replace(old_flow, new_flow, 1)
elif "starting must preserve the selected dose" not in flow:
    raise SystemExit("E2E timer flow anchor not found")
flow_path.write_text(flow, encoding="utf-8")
