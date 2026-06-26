import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { equipmentData1Sources } from "../data/evidence/equipmentData1.ts";

test("equipment source has an official location", () => {
  assert.equal(equipmentData1Sources.length, 1);
  assert.equal(equipmentData1Sources[0].type, "manufacturer");
  assert.match(equipmentData1Sources[0].canonicalUrl, /1zpresso\.coffee/);
});

test("equipment observations preserve adjustment and zero references", async () => {
  const adjustment = await readFile(
    new URL("../data/evidence/equipmentNotes1.ts", import.meta.url),
    "utf8",
  );
  const zeroReference = await readFile(
    new URL("../data/evidence/equipmentNotes2.ts", import.meta.url),
    "utf8",
  );

  assert.match(adjustment, /100클릭/);
  assert.match(adjustment, /버 이동량/);
  assert.match(zeroReference, /저항/);
});
