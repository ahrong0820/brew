import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { equipmentData1Sources } from "../data/evidence/equipmentData1.ts";

test("K-Ultra equipment sources have official locations", () => {
  assert.equal(equipmentData1Sources.length, 2);
  assert.ok(
    equipmentData1Sources.every((source) => source.type === "manufacturer"),
  );
  assert.ok(
    equipmentData1Sources.every((source) =>
      source.canonicalUrl.includes("1zpresso.coffee"),
    ),
  );

  const chart = equipmentData1Sources.find((source) =>
    source.id.includes("grind-setting-reference"),
  );
  assert.ok(chart);
  assert.match(chart.canonicalUrl, /K-Ultra-Grind-Setting-Reference-20230327\.jpg/);
  assert.match(chart.documentVersion, /20230327/);
  assert.ok(
    chart.notes.some((note) => note.includes("비접촉 영점")),
  );
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
