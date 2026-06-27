import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applyV60ReferenceGrind,
  appliesV60ReferenceGrind,
  v60ReferenceGrindRuleId,
  v60ReferenceGrindValue,
} from "../lib/recommendation/v60ReferenceGrind.ts";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

function recommendation(displayValue = "6.8") {
  return {
    templateName: "test",
    doseGrams: 15,
    waterGrams: 240,
    ratio: 16,
    temperatureCelsius: 92,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 180,
    grinder: {
      displayValue,
      displayRange: "6.6~7.0",
      commonDescription: "중간 분쇄",
      calibrationLabel: "테스트 영점",
      isNumeric: true,
      note: "기존 휴리스틱",
    },
    steps: [],
    reasons: [
      "가공 방식은 분쇄도 시작점에만 보수적으로 반영하고, HOT V60 초기 온도에는 별도 오프셋을 더하지 않았습니다.",
    ],
    confidence: "reference",
    confidenceReason: "test",
  };
}

function input({
  model = "1zpresso-k-ultra",
  calibrationProfile = "burr-no-rub",
  personalOffset = 0,
  brewer = "v60",
  drinkStyle = "hot",
  tasteGoal = "balanced",
  roastLevel = "medium-light",
  process = "washed",
} = {}) {
  return {
    bean: {
      id: "bean-test",
      name: "Test Bean",
      origin: "test",
      region: "test",
      process,
      roastLevel,
      createdAt: "2026-06-27T00:00:00Z",
      updatedAt: "2026-06-27T00:00:00Z",
    },
    grinder: {
      id: "grinder-test",
      model,
      displayName: "Test Grinder",
      calibrationProfile,
      calibrationLabel: "테스트 영점",
      calibrationStatus: "user-calibrated",
      recommendationStatus: "primary",
      displayUnit: model === "1zpresso-k-ultra" ? "dial" : "click",
      adjustmentDirection: "higher-is-coarser",
      displayStep: model === "1zpresso-k-ultra" ? 0.1 : 1,
      personalOffset,
      notes: [],
      isBuiltIn: true,
      createdAt: "2026-06-27T00:00:00Z",
      updatedAt: "2026-06-27T00:00:00Z",
    },
    preferences: {
      defaultBrewer: brewer,
      defaultDoseGrams: 15,
      defaultWaterGrams: 240,
      defaultDrinkStyle: drinkStyle,
      defaultGrinderProfileId: "grinder-test",
      defaultTasteGoal: tasteGoal,
      updatedAt: "2026-06-27T00:00:00Z",
    },
    tasteGoal,
  };
}

test("reference values preserve model baselines and grinder profile offsets", () => {
  assert.equal(v60ReferenceGrindValue("1zpresso-k-ultra"), 7);
  assert.equal(v60ReferenceGrindValue("1zpresso-k-ultra", 0.3), 7.3);
  assert.equal(v60ReferenceGrindValue("baratza-encore"), 18);
  assert.equal(v60ReferenceGrindValue("baratza-encore", 2), 20);
  assert.equal(v60ReferenceGrindValue("holzklotz-e80"), null);
  assert.equal(
    v60ReferenceGrindRuleId,
    "grind.v60-hot-paper.reference-start-no-bean-offsets.v1",
  );
});

test("HOT V60 K-Ultra burr-no-rub starts at one value across bean attributes", () => {
  const tasteGoals = ["sweet", "bright", "balanced", "body"];
  const roastLevels = ["light", "medium-light", "medium", "medium-dark", "dark"];
  const processes = ["washed", "natural", "honey", "fermented"];

  for (const tasteGoal of tasteGoals) {
    for (const roastLevel of roastLevels) {
      for (const process of processes) {
        const currentInput = input({ tasteGoal, roastLevel, process });
        const result = applyV60ReferenceGrind(recommendation(), currentInput);
        assert.equal(result.grinder.displayValue, "7.0");
        assert.equal(result.grinder.displayRange, "6.8~7.2");
      }
    }
  }
});

test("HOT V60 Encore starts at one value across bean attributes", () => {
  const currentInput = input({
    model: "baratza-encore",
    calibrationProfile: "factory-default",
    tasteGoal: "bright",
    roastLevel: "dark",
    process: "fermented",
  });
  const result = applyV60ReferenceGrind(recommendation("25"), currentInput);
  assert.equal(result.grinder.displayValue, "18");
  assert.equal(result.grinder.displayRange, "16~20");
  assert.match(result.grinder.note, /1~2클릭/);
});

test("the override removes stale process reasoning and explains its limits", () => {
  const result = applyV60ReferenceGrind(
    recommendation(),
    input({ process: "natural" }),
  );
  assert.equal(
    result.reasons.some((reason) => reason.includes("분쇄도 시작점에만")),
    false,
  );
  assert.ok(
    result.reasons.some((reason) => reason.includes("미검증 분쇄도 오프셋")),
  );
});

test("official-zero K-Ultra and out-of-scope brews remain unchanged", () => {
  const official = input({
    calibrationProfile: "manufacturer-resistance-start-zero",
  });
  const iced = input({ drinkStyle: "iced" });
  const switchInput = input({ brewer: "switch" });

  assert.equal(appliesV60ReferenceGrind(official), false);
  assert.equal(appliesV60ReferenceGrind(iced), false);
  assert.equal(appliesV60ReferenceGrind(switchInput), false);
  assert.equal(
    applyV60ReferenceGrind(recommendation("8.5"), official).grinder.displayValue,
    "8.5",
  );
  assert.equal(
    applyV60ReferenceGrind(recommendation("6.8"), iced).grinder.displayValue,
    "6.8",
  );
});

test("engine applies the rule before personal brew-history offsets", async () => {
  const [engine, personalized, registry, types] = await Promise.all([
    readProjectFile("lib/recommendation/engine.ts"),
    readProjectFile("lib/recommendation/personalized.ts"),
    readProjectFile("lib/recommendation/ruleRegistry.ts"),
    readProjectFile("lib/types/recommendationRule.ts"),
  ]);
  assert.match(engine, /v60ReferenceGrindRuleId/);
  assert.match(engine, /appliesV60ReferenceGrind/);
  assert.match(personalized, /applyV60ReferenceGrind\(ratioAdjusted, input\)/);
  assert.ok(
    personalized.indexOf("applyV60ReferenceGrind(ratioAdjusted, input)") <
      personalized.indexOf("const offset = input.recommendationOffset"),
  );
  assert.match(registry, /recommendationRuleRegistryVersion = "1\.6\.0"/);
  assert.match(types, /"v60-hot-paper-reference-grind"/);
});
