import assert from "node:assert/strict";
import test from "node:test";

import { buildDefaultRecipes } from "../data/defaultRecipeRefresh.ts";

const legacyRecipes = [
  { id: "tetsu-46", name: "4:6" },
  { id: "anstar-6888", name: "구버전 안스타" },
  { id: "jis-4666", name: "구버전 4666" },
  { id: "jis-ver2-hot", name: "구버전 Ver 2" },
  { id: "signature-cone", name: "시그니쳐" },
  { id: "deepblue-v60", name: "딥블루" },
  { id: "hoffmann-clever-water-first", name: "호프만" },
  { id: "jis-clever-112", name: "구버전 클레버" },
];

test("기본 목록에서 삭제·대체 대상이 제외된다", () => {
  const ids = buildDefaultRecipes(legacyRecipes).map((recipe) => recipe.id);

  for (const id of ["signature-cone", "deepblue-v60", "jis-4666", "jis-clever-112"]) {
    assert.equal(ids.includes(id), false);
  }
});

test("기본 목록에 최신 레시피와 안스타 통칭이 반영된다", () => {
  const recipes = buildDefaultRecipes(legacyRecipes);
  const byId = (id) => recipes.find((recipe) => recipe.id === id);

  assert.equal(byId("anstar-6888")?.name, "안스타 6888");
  assert.equal(byId("tetsu-neo-2026")?.totalTime, 180);
  assert.equal(byId("jis-ver2-hot")?.totalTime, 170);
  assert.equal(byId("jis-484-15g-2026")?.totalTime, 170);
  assert.equal(byId("jis-clever-1-11")?.name, "정인성 클레버 1:11");
});
