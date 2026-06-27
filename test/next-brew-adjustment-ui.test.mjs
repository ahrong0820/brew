import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("adjustment drawer shows recipe context and one-variable wording", async () => {
  const drawer = await readProjectFile("app/NextBrewAdjustmentDrawer.tsx");

  assert.match(drawer, /AdjustmentContextPanel/);
  assert.match(drawer, /readAdjustmentContext/);
  assert.match(drawer, /원본 레시피 구조를 유지/);
  assert.match(drawer, /이번에 바꿀 한 변수/);
  assert.match(drawer, /이 한 변수만 반영/);
  assert.match(drawer, /같은 원두·장비·레시피 조건/);
});

test("context panel shows time taste stage counts and fixed conditions", async () => {
  const panel = await readProjectFile("app/AdjustmentContextPanel.tsx");

  assert.match(panel, /원본 레시피/);
  assert.match(panel, /실제 \{props\.actualTime\}/);
  assert.match(panel, /목표 \{props\.targetTime\}/);
  assert.match(panel, /맛 \{props\.tastingLabel\}/);
  assert.match(panel, /전체 \{props\.totalCount\}회/);
  assert.match(panel, /이번에 유지할 조건/);
  assert.match(panel, /props\.fixedConditions\.map/);
});
