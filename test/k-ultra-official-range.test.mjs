import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createDefaultGrinderProfiles,
  createDefaultUserPreferences,
  defaultGrinderProfileIds,
} from "../data/defaultCoffeeProfiles.ts";
import {
  isKUltraOfficialProfile,
  kUltraOfficialCalibrationProfile,
  kUltraOfficialDialValue,
  kUltraOfficialRange,
  kUltraOfficialRuleId,
} from "../lib/recommendation/kUltraOfficialRange.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("built-in profiles keep burr-no-rub default and add explicit official zero", () => {
  const profiles = createDefaultGrinderProfiles("2026-06-27T00:00:00Z");
  const preferences = createDefaultUserPreferences("2026-06-27T00:00:00Z");
  assert.equal(profiles.length, 4);
  assert.equal(
    preferences.defaultGrinderProfileId,
    defaultGrinderProfileIds.kUltraBurrNoRub,
  );
  const burrNoRub = profiles.find(
    (profile) => profile.id === defaultGrinderProfileIds.kUltraBurrNoRub,
  );
  const official = profiles.find(
    (profile) => profile.id === defaultGrinderProfileIds.kUltraOfficialZero,
  );
  assert.ok(burrNoRub);
  assert.ok(official);
  assert.equal(burrNoRub.calibrationProfile, "burr-no-rub");
  assert.equal(official.calibrationProfile, kUltraOfficialCalibrationProfile);
  assert.equal(official.calibrationLabel, "제조사 저항 시작 영점");
  assert.equal(isKUltraOfficialProfile(burrNoRub), false);
  assert.equal(isKUltraOfficialProfile(official), true);
  assert.ok(burrNoRub.notes.some((note) => note.includes("무보정으로 환산하지 않습니다")));
  assert.ok(official.notes.some((note) => note.includes("8.0~9.0")));
});

test("official helper returns the chart midpoint and clamps profile offsets", () => {
  assert.deepEqual(kUltraOfficialRange, { min: 8, max: 9, center: 8.5 });
  assert.equal(kUltraOfficialDialValue(), 8.5);
  assert.equal(kUltraOfficialDialValue(0.2), 8.7);
  assert.equal(kUltraOfficialDialValue(1), 9);
  assert.equal(kUltraOfficialDialValue(-1), 8);
  assert.equal(kUltraOfficialRuleId, "grind.1zpresso-k-ultra.official-zero.v1");
});

test("engine applies official range only to HOT V60 official-zero profiles", async () => {
  const [baseEngine, engine, personalized] = await Promise.all([
    readProjectFile("lib/recommendation/baseEngine.ts"),
    readProjectFile("lib/recommendation/engine.ts"),
    readProjectFile("lib/recommendation/personalized.ts"),
  ]);
  assert.match(baseEngine, /isKUltraOfficialProfile\(input\.grinder\)/);
  assert.match(baseEngine, /defaultBrewer === "v60"/);
  assert.match(baseEngine, /defaultDrinkStyle === "hot"/);
  assert.match(baseEngine, /무보정으로 환산하지 않습니다/);
  assert.match(engine, /kUltraOfficialRuleId/);
  assert.match(personalized, /usesKUltraOfficialRange/);
  assert.match(personalized, /kUltraOfficialRange\.min/);
  assert.match(personalized, /kUltraOfficialRange\.max/);
});

test("official range rule is manufacturer-backed and calibration-specific", async () => {
  const [rules, candidateRegistry, ruleRegistry] = await Promise.all([
    readProjectFile("data/recommendation/rules.ts"),
    readProjectFile("lib/recommendation/candidateRuleRegistry.ts"),
    readProjectFile("lib/recommendation/ruleRegistry.ts"),
  ]);
  assert.ok(rules.includes(kUltraOfficialRuleId));
  assert.match(rules, /obs:manufacturer:1zpresso:k-ultra:pour-over-range/);
  assert.match(rules, /obs:equipment-data-1:zero-reference/);
  assert.match(rules, /obs:equipment-data-1:adjustment/);
  assert.match(candidateRegistry, /candidateRuleRegistryVersion = "1\.5\.0"/);
  assert.match(ruleRegistry, /recommendationRuleRegistryVersion = "1\.6\.0"/);
});
