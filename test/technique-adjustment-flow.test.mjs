import assert from "node:assert/strict";
import test from "node:test";

import { decideAdjustmentAction } from "../lib/recommendation/adjustmentPolicy.ts";
import { decideAdjustmentProgression } from "../lib/recommendation/adjustmentProgressionDecision.ts";
import { applyTechniqueOffsetRecommendation } from "../lib/recommendation/techniqueOffsetRecommendation.ts";

function trial(id, outcome) {
  return {
    id,
    sourceSessionId: `session-${id}`,
    variable: "grind",
    action: "finer",
    delta: -0.1,
    currentValue: "7.0",
    nextValue: "6.9",
    outcome,
    appliedAt: "2026-01-01T00:00:00.000Z",
    evaluatedAt: "2026-01-01T00:05:00.000Z",
  };
}

test("Clever bitter and astringent feedback changes agitation", () => {
  assert.equal(
    decideAdjustmentAction({
      brewerType: "clever",
      brewPaceAssessment: "in-range",
      tastingResult: "bitter-astringent",
    }),
    "less-agitation",
  );
});

test("Clever muted aroma changes immersion time", () => {
  assert.equal(
    decideAdjustmentAction({
      brewerType: "clever",
      brewPaceAssessment: "in-range",
      tastingResult: "aroma-muted",
    }),
    "shorter-immersion",
  );
});

test("two limited Clever grind trials switch to immersion time", () => {
  const history = [trial("one", "improved"), trial("two", "improved")];
  const decision = decideAdjustmentProgression({
    baseAction: "finer",
    previous: history[1],
    history,
    brewerType: "clever",
    brewPaceAssessment: "fast",
    tastingResult: "too-sour",
  });
  assert.equal(decision.action, "longer-immersion");
  assert.match(decision.reason, /클레버 침출 시간/);
});

test("worse technique trial reverses the technique action", () => {
  const previous = {
    ...trial("agitation", "worse"),
    variable: "agitation",
    action: "less-agitation",
  };
  const decision = decideAdjustmentProgression({
    baseAction: "less-agitation",
    previous,
    history: [previous],
    brewerType: "clever",
    brewPaceAssessment: "in-range",
    tastingResult: "bitter-astringent",
  });
  assert.equal(decision.action, "more-agitation");
});

test("stored V60 pour offset changes cues without changing numeric recipe values", () => {
  const recommendation = {
    templateName: "테스트",
    doseGrams: 15,
    waterGrams: 240,
    ratio: 16,
    temperatureCelsius: 92,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 180,
    grinder: {
      displayValue: "7.0",
      displayRange: "6.5~7.5",
      commonDescription: "중간",
      calibrationLabel: "사용자 영점",
      isNumeric: true,
      note: "참고",
    },
    steps: [
      { label: "블룸", startSeconds: 0, targetWaterGrams: 40, cue: "가스를 빼기" },
      { label: "본 주입", startSeconds: 30, targetWaterGrams: 240, cue: "원형으로 붓기" },
    ],
    reasons: [],
    confidence: "reference",
    confidenceReason: "참고",
    appliedRules: [],
  };
  const result = applyTechniqueOffsetRecommendation(recommendation, {
    bean: {},
    grinder: {},
    preferences: {
      defaultBrewer: "v60",
      defaultDrinkStyle: "hot",
    },
    tasteGoal: "balanced",
    recommendationOffset: { "pour-structure": -1 },
  });
  assert.equal(result.temperatureCelsius, 92);
  assert.equal(result.ratio, 16);
  assert.match(result.steps[1].cue, /주전자 높이를 낮추고/);
  assert.ok(result.reasons.some((reason) => reason.startsWith("[푸어 구조]")));
  assert.ok(
    result.appliedRules.some((rule) => rule.id === "pour.personal-gentler.v1"),
  );
});
