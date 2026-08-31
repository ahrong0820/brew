import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const mobileNav = await readFile(
  new URL("../app/MobileCoffeeNav.tsx", import.meta.url),
  "utf8",
);

test("timer dose input uses React draft and committed numeric state", () => {
  assert.match(page, /const \[doseInput, setDoseInput\] = useState/);
  assert.match(page, /value=\{doseInput\}/);
  assert.match(page, /data-timer-dose-input="true"/);
  assert.match(page, /nextValue === ""/);
  assert.match(page, /nextDose >= 8 && nextDose <= 40/);
  assert.match(page, /onBlur=\{commitTimerDoseInput\}/);
  assert.match(page, /event\.key === "Enter"/);
  assert.match(page, /syncTimerDose\(recipe\.dose\)/);
  assert.doesNotMatch(
    page,
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
