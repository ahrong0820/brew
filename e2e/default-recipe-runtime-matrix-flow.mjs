import assert from "node:assert/strict";

import { defaultRecipes } from "../data/defaultRecipes.ts";
import { formatRecipeWaterAmount } from "../lib/recipes/recipePresentation.ts";
import { scaleRecipeDose } from "../lib/recipes/scaleRecipeDose.ts";
import { resetBrowserStorage, runStaticE2E } from "./helpers/static-e2e-harness.mjs";

const sessionStorageKey = "brew.activeRecommendationSession.v1";

function normalized(value) {
  return JSON.parse(JSON.stringify(value));
}

function chooseTargetDose(baseDose) {
  if (baseDose >= 18) return Math.max(8, baseDose - 5);
  return Math.min(40, baseDose + 3);
}

function currentStepIndexAt(recipe, elapsed) {
  const index = recipe.steps.findIndex((step) => elapsed < step.end);
  return index === -1 ? recipe.steps.length - 1 : index;
}

function expectedStepWater(recipe, index) {
  const step = recipe.steps[index];
  const previousTarget = index > 0 ? recipe.steps[index - 1].targetWater : 0;
  return step.displayStepWater ?? step.targetWater - previousTarget;
}

async function readClock(page) {
  return page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key) || "null"),
    sessionStorageKey,
  );
}

async function readAlertCounts(page) {
  return page.evaluate(() => ({
    tone: window.__brewTestToneStarts || 0,
    vibration: window.__brewTestVibrations || 0,
  }));
}

async function expectAlertCounts(page, minimumTone, minimumVibration, label) {
  await page.waitForFunction(
    ({ tone, vibration }) =>
      (window.__brewTestToneStarts || 0) >= tone &&
      (window.__brewTestVibrations || 0) >= vibration,
    { tone: minimumTone, vibration: minimumVibration },
  );
  const counts = await readAlertCounts(page);
  assert.ok(counts.tone >= minimumTone, `${label}: smart alert tone must run`);
  assert.ok(
    counts.vibration >= minimumVibration,
    `${label}: smart alert vibration must run`,
  );
}

runStaticE2E(
  "default-recipe-runtime-matrix",
  async ({ page }) => {
    await page.addInitScript(() => {
      window.__brewTestToneStarts = 0;
      window.__brewTestVibrations = 0;

      class FakeOscillator {
        constructor() {
          this.frequency = { value: 0 };
          this.type = "sine";
          this.ended = null;
        }
        connect() {}
        disconnect() {}
        addEventListener(name, listener) {
          if (name === "ended") this.ended = listener;
        }
        start() {
          window.__brewTestToneStarts += 1;
        }
        stop() {
          this.ended?.();
        }
      }

      class FakeGain {
        constructor() {
          this.gain = {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
          };
        }
        connect() {}
        disconnect() {}
      }

      class FakeAudioContext {
        constructor() {
          this.state = "running";
          this.currentTime = 0;
          this.destination = {};
        }
        createOscillator() {
          return new FakeOscillator();
        }
        createGain() {
          return new FakeGain();
        }
        async resume() {
          this.state = "running";
        }
        async close() {
          this.state = "closed";
        }
      }

      Object.defineProperty(window, "AudioContext", {
        configurable: true,
        value: FakeAudioContext,
      });
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value() {
          window.__brewTestVibrations += 1;
          return true;
        },
      });
    });

    await resetBrowserStorage(page);

    const timerPanel = page.locator('[data-timer-panel="true"]');
    const doseInput = timerPanel.locator('[data-timer-dose-input="true"]');
    const nextButton = timerPanel.getByRole("button", {
      name: "다음 단계",
      exact: true,
    });

    assert.ok(defaultRecipes.length > 0, "default recipe registry must not be empty");

    const verifiedRecipes = [];

    for (const recipe of defaultRecipes) {
      assert.ok(recipe.steps.length > 0, `${recipe.name}: steps must exist`);
      assert.ok(recipe.totalTime > 0, `${recipe.name}: total time must be positive`);

      const row = page.locator(
        `[data-recipe-row="true"][data-recipe-id="${recipe.id}"]`,
      );
      await row.locator('[data-recipe-select="true"]').click();
      await page.waitForFunction(
        (recipeId) =>
          document.querySelector(
            `[data-recipe-row="true"][data-recipe-id="${recipeId}"]`,
          )?.getAttribute("data-recipe-selected") === "true",
        recipe.id,
      );

      assert.equal(
        await doseInput.inputValue(),
        String(recipe.dose),
        `${recipe.name}: selecting recipe must restore its default dose`,
      );

      const targetDose = chooseTargetDose(recipe.dose);
      assert.notEqual(targetDose, recipe.dose, `${recipe.name}: test dose must change`);
      const scaledRecipe = scaleRecipeDose(recipe, targetDose);

      await doseInput.fill(String(targetDose));
      await doseInput.press("Enter");
      assert.equal(
        await doseInput.inputValue(),
        String(targetDose),
        `${recipe.name}: edited dose must persist before start`,
      );

      if (
        scaledRecipe.brewWater !== undefined &&
        scaledRecipe.bypassWater !== undefined &&
        scaledRecipe.finalWater !== undefined
      ) {
        const brewWaterBox = timerPanel.getByText("추출수", { exact: true }).locator("..");
        const bypassBox = timerPanel.getByText("후가수", { exact: true }).locator("..");
        const finalBox = timerPanel.getByText("최종 물", { exact: true }).locator("..");
        assert.match(
          (await brewWaterBox.textContent()) || "",
          new RegExp(`${scaledRecipe.brewWater}g`),
          `${recipe.name}: brew water must scale with dose`,
        );
        assert.ok(
          ((await bypassBox.textContent()) || "").includes(
            formatRecipeWaterAmount(scaledRecipe.bypassWater),
          ),
          `${recipe.name}: bypass water must scale with dose`,
        );
        assert.ok(
          ((await finalBox.textContent()) || "").includes(
            formatRecipeWaterAmount(scaledRecipe.finalWater),
          ),
          `${recipe.name}: final water must scale with dose`,
        );
      } else {
        const totalWaterBox = timerPanel
          .getByText("총 물량", { exact: true })
          .locator("..");
        assert.match(
          (await totalWaterBox.textContent()) || "",
          new RegExp(`${scaledRecipe.water}g`),
          `${recipe.name}: total water must scale with dose`,
        );
      }

      const firstIndex = currentStepIndexAt(scaledRecipe, 0);
      const firstStep = scaledRecipe.steps[firstIndex];
      const currentWaterBox = timerPanel
        .getByText("현재 물량", { exact: true })
        .locator("..");
      const stepWaterBox = timerPanel
        .getByText("이번 단계", { exact: true })
        .locator("..");
      assert.ok(
        ((await currentWaterBox.textContent()) || "").includes(
          formatRecipeWaterAmount(
            firstStep.displayTargetWater ?? firstStep.targetWater,
          ),
        ),
        `${recipe.name}: initial target water must scale correctly`,
      );
      assert.ok(
        ((await stepWaterBox.textContent()) || "").includes(
          formatRecipeWaterAmount(expectedStepWater(scaledRecipe, firstIndex)),
        ),
        `${recipe.name}: initial step water must scale correctly`,
      );

      const alertBefore = await readAlertCounts(page);

      await timerPanel.getByRole("button", { name: "시작", exact: true }).click();
      await timerPanel
        .getByRole("button", { name: "일시정지", exact: true })
        .waitFor();

      const startedClock = await readClock(page);
      assert.equal(startedClock?.status, "running", `${recipe.name}: start must run timer`);
      assert.equal(startedClock?.recipe?.id, recipe.id, `${recipe.name}: clock recipe id`);
      assert.deepEqual(
        startedClock?.recipe,
        normalized(scaledRecipe),
        `${recipe.name}: started recipe snapshot must contain fully scaled water and steps`,
      );

      let expectedIndex = firstIndex;
      let expectedAlertDelta = 0;
      const visitedActiveSteps = new Set([firstIndex]);

      for (let safety = 0; safety < scaledRecipe.steps.length + 3; safety += 1) {
        const clockBefore = await readClock(page);
        if (clockBefore?.status === "completed") break;

        const nextRawStep = scaledRecipe.steps[expectedIndex + 1];
        const nextElapsed = nextRawStep ? nextRawStep.start : scaledRecipe.totalTime;
        const nextIndex = currentStepIndexAt(scaledRecipe, nextElapsed);
        const completing = nextElapsed >= scaledRecipe.totalTime;

        if (nextIndex !== expectedIndex && nextIndex > 0) {
          expectedAlertDelta += 1;
        }
        if (completing) {
          expectedAlertDelta += 1;
        }

        await nextButton.click();

        if (completing) {
          await page.waitForFunction(
            (key) =>
              JSON.parse(sessionStorage.getItem(key) || "null")?.status ===
              "completed",
            sessionStorageKey,
          );
        } else {
          await page.waitForFunction(
            ({ key, minimum }) => {
              const clock = JSON.parse(sessionStorage.getItem(key) || "null");
              return clock?.elapsedSeconds >= minimum;
            },
            { key: sessionStorageKey, minimum: nextElapsed },
          );
        }

        expectedIndex = nextIndex;
        visitedActiveSteps.add(expectedIndex);
        const expectedStep = scaledRecipe.steps[expectedIndex];
        await timerPanel
          .getByRole("heading", { name: expectedStep.label, exact: true })
          .first()
          .waitFor();

        assert.ok(
          ((await currentWaterBox.textContent()) || "").includes(
            formatRecipeWaterAmount(
              expectedStep.displayTargetWater ?? expectedStep.targetWater,
            ),
          ),
          `${recipe.name}: ${expectedStep.label} target water must be correct`,
        );
        assert.ok(
          ((await stepWaterBox.textContent()) || "").includes(
            formatRecipeWaterAmount(expectedStepWater(scaledRecipe, expectedIndex)),
          ),
          `${recipe.name}: ${expectedStep.label} step water must be correct`,
        );

        await expectAlertCounts(
          page,
          alertBefore.tone + expectedAlertDelta,
          alertBefore.vibration + expectedAlertDelta,
          `${recipe.name}: ${expectedStep.label}`,
        );

        if (completing) break;
      }

      const completedClock = await readClock(page);
      assert.equal(
        completedClock?.status,
        "completed",
        `${recipe.name}: reaching total time must complete the session`,
      );
      assert.ok(
        completedClock.elapsedSeconds >= scaledRecipe.totalTime,
        `${recipe.name}: completed elapsed time must reach total time`,
      );
      await timerPanel.getByRole("button", { name: "시작", exact: true }).waitFor();

      const activeStepIndexes = scaledRecipe.steps
        .map((step, index) => ({ step, index }))
        .filter(({ step }) => step.end > step.start)
        .map(({ index }) => index);
      assert.deepEqual(
        [...visitedActiveSteps].sort((a, b) => a - b),
        activeStepIndexes,
        `${recipe.name}: next-step progression must visit every active brewing step`,
      );

      const alertAfter = await readAlertCounts(page);
      assert.ok(
        alertAfter.tone > alertBefore.tone,
        `${recipe.name}: smart alert tone must fire during the recipe`,
      );
      assert.ok(
        alertAfter.vibration > alertBefore.vibration,
        `${recipe.name}: smart alert vibration must fire during the recipe`,
      );

      verifiedRecipes.push(recipe.id);
    }

    assert.deepEqual(
      verifiedRecipes,
      defaultRecipes.map((recipe) => recipe.id),
      "every registered default recipe must pass the runtime matrix",
    );

    console.log(
      `Runtime matrix verified ${verifiedRecipes.length} default recipes: ${verifiedRecipes.join(", ")}`,
    );
  },
  { viewport: { width: 1280, height: 900 } },
);
