import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOriginRegionKey } from "#origin-region-matching";
import { evidenceWeightPolicy } from "../data/recommendation/evidenceWeightPolicy.ts";
import { calculateConditionMatch } from "../lib/recommendation/evidenceWeightCore.ts";

const target = {
  bean: {
    originCountries: ["ethiopia"],
    originGroups: ["east-africa"],
    originRegions: ["Guji"],
  },
};

function originState(evidence, targetContext = target) {
  return calculateConditionMatch(
    evidence,
    targetContext,
    evidenceWeightPolicy,
  ).dimensions.origin;
}

test("origin condition prefers matching region within the same country", () => {
  assert.equal(
    originState({
      bean: {
        originCountries: ["ethiopia"],
        originGroups: ["east-africa"],
        originRegions: ["Guji"],
      },
    }),
    "match",
  );

  assert.equal(
    originState({
      bean: {
        originCountries: ["ethiopia"],
        originGroups: ["east-africa"],
        originRegions: ["Sidama"],
      },
    }),
    "partial",
  );
});

test("origin condition falls back to country or group when region detail is missing", () => {
  assert.equal(
    originState({
      bean: {
        originCountries: ["ethiopia"],
        originGroups: ["east-africa"],
      },
    }),
    "match",
  );

  assert.equal(
    originState({
      bean: {
        originCountries: ["kenya"],
        originGroups: ["east-africa"],
      },
    }),
    "partial",
  );

  assert.equal(
    originState({ bean: { originGroups: ["east-africa"] } }),
    "partial",
  );
});

test("region text uses mechanical normalization without alias inference", () => {
  assert.equal(normalizeOriginRegionKey("  Ｇｕｊｉ  "), "guji");
  assert.equal(normalizeOriginRegionKey("North   Kirinyaga"), "north kirinyaga");

  assert.equal(
    originState({
      bean: {
        originCountries: ["ethiopia"],
        originGroups: ["east-africa"],
        originRegions: ["  ＧＵＪＩ "],
      },
    }),
    "match",
  );

  assert.equal(
    originState(
      {
        bean: {
          originCountries: ["ethiopia"],
          originGroups: ["east-africa"],
          originRegions: ["Sidamo"],
        },
      },
      {
        bean: {
          originCountries: ["ethiopia"],
          originGroups: ["east-africa"],
          originRegions: ["Sidama"],
        },
      },
    ),
    "partial",
  );
});

test("matching region text does not override a country mismatch", () => {
  assert.equal(
    originState({
      bean: {
        originCountries: ["kenya"],
        originGroups: ["east-africa"],
        originRegions: ["Guji"],
      },
    }),
    "partial",
  );
});

test("origin condition distinguishes mismatch, unknown and not-applicable", () => {
  assert.equal(
    originState({
      bean: {
        originCountries: ["colombia"],
        originGroups: ["latin-america"],
        originRegions: ["Huila"],
      },
    }),
    "mismatch",
  );
  assert.equal(originState({ bean: {} }), "unknown");
  assert.equal(originState({}, { brew: { brewerTypes: ["v60"] } }), "not-applicable");
});

test("origin relevance ranks exact, broader, unknown and mismatch contexts", () => {
  const contexts = [
    {
      bean: {
        originCountries: ["ethiopia"],
        originGroups: ["east-africa"],
        originRegions: ["Guji"],
      },
    },
    { bean: { originGroups: ["east-africa"] } },
    { bean: {} },
    {
      bean: {
        originCountries: ["colombia"],
        originGroups: ["latin-america"],
        originRegions: ["Huila"],
      },
    },
  ];
  const scores = contexts.map(
    (context) =>
      calculateConditionMatch(context, target, evidenceWeightPolicy).score,
  );

  assert.ok(scores[0] > scores[1]);
  assert.ok(scores[1] > scores[2]);
  assert.ok(scores[2] > scores[3]);
});

test("condition dimension weights remain normalized after region-first matching", () => {
  const total = Object.values(
    evidenceWeightPolicy.conditionDimensionWeights,
  ).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1) < 1e-12);
  assert.equal(evidenceWeightPolicy.version, "1.2.0");
  assert.equal(evidenceWeightPolicy.conditionDimensionWeights.origin, 0.11);
});
