import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const enhancer = await readFile(
  new URL("../app/MobileRecipeEnhancer.tsx", import.meta.url),
  "utf8",
);
const mobileNav = await readFile(
  new URL("../app/MobileCoffeeNav.tsx", import.meta.url),
  "utf8",
);

test("mobile timer dose input keeps blank and partial editing states", () => {
  assert.match(enhancer, /input\.dataset\.timerDoseInput = "true"/);
  assert.match(enhancer, /document\.addEventListener\("input", handleTimerDoseInput, true\)/);
  assert.match(enhancer, /input\.value === "" \|\| !isValidTimerDose\(value\)/);
  assert.match(enhancer, /event\.stopPropagation\(\)/);
  assert.match(enhancer, /document\.addEventListener\("focusout", handleTimerDoseBlur\)/);
  assert.match(enhancer, /input\.dispatchEvent\(new Event\("input", \{ bubbles: true \}\)\)/);
});

test("mobile tools do not hide their own buttons and include personal recipes", () => {
  assert.match(mobileNav, /data-mobile-coffee-nav="true"/);
  assert.match(mobileNav, /button\.closest\(mobileNavRootSelector\)/);
  assert.match(mobileNav, /key: "personal-recipes", label: "개인 레시피"/);
  assert.match(mobileNav, /openLauncher\("personal-recipes"\)/);
  assert.match(mobileNav, /subscribeToBrewSessionClock\(syncActiveSession\)/);
});
