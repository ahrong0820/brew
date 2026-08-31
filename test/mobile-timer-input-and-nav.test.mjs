import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const timerHook = await readFile(
  new URL("../app/hooks/useBrewTimer.ts", import.meta.url),
  "utf8",
);
const timerPanel = await readFile(
  new URL("../app/BrewTimerPanel.tsx", import.meta.url),
  "utf8",
);
const mobileNav = await readFile(
  new URL("../app/MobileCoffeeNav.tsx", import.meta.url),
  "utf8",
);

test("timer dose input uses React draft and committed numeric state", () => {
  assert.match(timerHook, /const \[doseInput, setDoseInput\] = useState/);
  assert.match(timerPanel, /value=\{timer\.doseInput\}/);
  assert.match(timerPanel, /data-timer-dose-input="true"/);
  assert.match(timerHook, /nextValue === ""/);
  assert.match(timerHook, /nextDose >= 8 && nextDose <= 40/);
  assert.match(timerPanel, /onBlur=\{timer\.commitDoseInput\}/);
  assert.match(timerPanel, /event\.key === "Enter"/);
  assert.match(timerHook, /syncTimerDose\(recipe\.dose\)/);
  assert.doesNotMatch(
    `${timerHook}\n${timerPanel}`,
    /setNativeInputValue|handleTimerDoseInput|doseDraftInterval|timerDoseSelector/,
  );
});

test("mobile tools open centralized React tool state without DOM launcher discovery", () => {
  assert.match(mobileNav, /data-mobile-coffee-nav="true"/);
  assert.match(mobileNav, /useCoffeeTools\(\)/);
  assert.match(mobileNav, /openTool\(key\)/);
  assert.match(mobileNav, /openLauncher\("personal-recipes"\)/);
  assert.match(mobileNav, /subscribeToBrewSessionClock\(syncActiveSession\)/);
  assert.doesNotMatch(mobileNav, /querySelectorAll<HTMLButtonElement>/);
  assert.doesNotMatch(mobileNav, /MutationObserver/);
  assert.doesNotMatch(mobileNav, /normalizedText|textContent|\.click\(\)/);
});
