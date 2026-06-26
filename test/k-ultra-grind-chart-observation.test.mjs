import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { equipmentData1Sources } from "../data/evidence/equipmentData1.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const observationId = "obs:manufacturer:1zpresso:k-ultra:pour-over-range";

test("official K-Ultra chart source is registered separately", () => {
  const chart = equipmentData1Sources.find(
    (source) =>
      source.id ===
      "manufacturer:1zpresso:k-ultra:grind-setting-reference-2023",
  );

  assert.ok(chart);
  assert.equal(chart.type, "manufacturer");
  assert.equal(chart.productModel, "K-Ultra");
  assert.match(chart.canonicalUrl, /K-Ultra-Grind-Setting-Reference-20230327\.jpg/);
});

test("observation preserves the official 8.0 to 9.0 range and zero boundary", async () => {
  const observation = await readProjectFile("data/evidence/equipmentNotes3.ts");

  assert.ok(observation.includes(observationId));
  assert.match(observation, /min: 8, max: 9, unit: "dial number"/);
  assert.match(observation, /Siphon\/Pour Over/);
  assert.match(observation, /공식 영점/);
  assert.match(observation, /버 비접촉 영점/);
  assert.match(observation, /무보정으로 복사하지 않습니다/);
  assert.match(observation, /V60 도징, 원두, 필터와 목표 시간별 단일 정답을 제공하지 않습니다/);
});

test("registry and evidence validation include the K-Ultra observation", async () => {
  const [registry, validation] = await Promise.all([
    readProjectFile("lib/evidence/registry.ts"),
    readProjectFile("scripts/validate-evidence.mjs"),
  ]);

  assert.match(registry, /import \{ equipmentNotes3 \}/);
  assert.match(registry, /\.\.\.equipmentNotes3/);
  assert.match(registry, /evidenceRegistryVersion = "1\.18\.0"/);
  assert.match(validation, /import \{ equipmentNotes3 \}/);
  assert.match(validation, /\.\.\.equipmentNotes3/);
});

test("Observation does not change active grinder recommendation values", async () => {
  const [rules, baseEngine] = await Promise.all([
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("lib/recommendation/baseEngine.ts"),
  ]);

  assert.equal(rules.includes(observationId), false);
  assert.match(baseEngine, /v60: 7/);
  assert.equal(baseEngine.includes("pour-over-range"), false);
});
