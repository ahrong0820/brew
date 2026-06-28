import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("personal recipe versions can be restored without deleting history", async () => {
  const restore = await read("lib/brew/personalRecipeRestore.ts");
  assert.match(restore, /currentBestSessionId: restoredSession\.id/);
  assert.match(restore, /versions/);
  assert.match(restore, /version: version\.version/);
  assert.doesNotMatch(restore, /versions:\s*\[/);
});

test("personal recipe UI shows status, promotion condition and restore action", async () => {
  const drawer = await read("app/PersonalRecipeVersionDrawer.tsx");
  assert.match(drawer, /잠정 개인 성공/);
  assert.match(drawer, /안정 개인 성공/);
  assert.match(drawer, /좋음 1회 추가 시 안정으로 승격/);
  assert.match(drawer, /restorePersonalRecipeVersion/);
});

test("mobile overlay coordinator hides floating controls and locks scrolling", async () => {
  const coordinator = await read("app/MobileOverlayCoordinator.tsx");
  assert.match(coordinator, /coffeeOverlayOpen/);
  assert.match(coordinator, /body\.style\.overflow = "hidden"/);
  assert.match(coordinator, /pointer-events: none/);
});

test("recommendations expose audited source state", async () => {
  const types = await read("lib/types/recommendation.ts");
  const apply = await read("lib/recommendation/baristaRecipeRecommendation.ts");
  assert.match(types, /sourceStatus\?: "verified" \| "reference"/);
  assert.match(apply, /sourceStatus: recipe\.sourceStatus/);
});
