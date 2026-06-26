import assert from "node:assert/strict";
import test from "node:test";

import { evidenceSources } from "../data/evidence/sources.ts";
import { brewSessionToObservation } from "../lib/evidence/personalObservationAdapter.ts";
import {
  matchesPersonalEvidenceIdentity,
  personalEvidenceIdentityFromProfile,
} from "../lib/evidence/personalEvidenceQuery.ts";
import { summarizePersonalSessions } from "../lib/evidence/personalEvidenceSummary.ts";
import { validateEvidenceRegistry } from "../lib/evidence/validation.ts";

const bean = {
  id: "bean-1",
  name: "Test Bean",
  originCountry: "ethiopia",
  originGroup: "east-africa",
  roastLevel: "light",
  process: "washed",
  roastDate: "2026-06-16",
  variety: "74110",
  createdAt: "2026-06-16T00:00:00Z",
  updatedAt: "2026-06-16T00:00:00Z",
};

function profile(overrides = {}) {
  return {
    id: "profile-hot-g1",
    beanId: "bean-1",
    brewerType: "v60",
    drinkStyle: "hot",
    grinderProfileId: "grinder-1",
    tasteGoal: "balanced",
    recommendationOffset: {},
    createdAt: "2026-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
    ...overrides,
  };
}

function session(profileValue, overrides = {}) {
  const drinkStyle = overrides.drinkStyle ?? profileValue.drinkStyle;
  return {
    id: "session-1",
    beanId: profileValue.beanId,
    profileId: profileValue.id,
    drinkStyle,
    tasteGoal: profileValue.tasteGoal,
    recommendationConfidence: "medium",
    recipeSnapshot: {
      sourceTemplateId: "recommendation-hot-v60-balanced",
      sourceTemplateName: "test",
      brewerType: profileValue.brewerType,
      drinkStyle,
      doseGrams: 15,
      waterGrams: 240,
      ratio: 16,
      temperatureCelsius: 92,
      grindLevel: 7,
      grinderDisplayValue: "7.0",
      grinderProfileId: profileValue.grinderProfileId,
      grinderModel: "1zpresso-k-ultra",
      estimatedRepresentativeMicrons: 850,
      totalTimeSeconds: 195,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 195,
      steps: [
        {
          label: "Bloom",
          startSeconds: 0,
          endSeconds: 40,
          targetWaterGrams: 40,
          cue: "Wet grounds",
        },
      ],
    },
    actualTimeSeconds: 180,
    tastingResult: "good",
    status: "good",
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
    ...overrides,
  };
}

test("brew sessions become valid personal evidence observations", () => {
  const hotProfile = profile();
  const observation = brewSessionToObservation(session(hotProfile), {
    bean,
    profile: hotProfile,
  });

  assert.equal(observation.id, "obs:personal:session-1");
  assert.equal(observation.sourceId, "local:user-brew-history");
  assert.equal(observation.kind, "user-outcome");
  assert.deepEqual(observation.context.brew.drinkStyles, ["hot"]);
  assert.deepEqual(observation.context.bean.roastAgeDays, {
    min: 10,
    max: 10,
    unit: "day",
  });
  assert.equal(observation.outcome.value.value, "good");
  assert.ok(
    observation.variables.some(
      (variable) =>
        variable.name === "actualTimeSeconds" && variable.value.value === 180,
    ),
  );

  assert.deepEqual(
    validateEvidenceRegistry({
      version: "test",
      sources: evidenceSources,
      observations: [observation],
    }),
    [],
  );
});

test("personal evidence identity does not mix hot, iced or another grinder", () => {
  const hotProfile = profile();
  const icedProfile = profile({
    id: "profile-iced-g1",
    drinkStyle: "iced",
  });
  const otherGrinderProfile = profile({
    id: "profile-hot-g2",
    grinderProfileId: "grinder-2",
  });
  const identity = personalEvidenceIdentityFromProfile(hotProfile);

  assert.equal(
    matchesPersonalEvidenceIdentity(
      session(hotProfile),
      hotProfile,
      identity,
    ),
    true,
  );
  assert.equal(
    matchesPersonalEvidenceIdentity(
      session(icedProfile, { id: "session-iced" }),
      icedProfile,
      identity,
    ),
    false,
  );
  assert.equal(
    matchesPersonalEvidenceIdentity(
      session(otherGrinderProfile, { id: "session-g2" }),
      otherGrinderProfile,
      identity,
    ),
    false,
  );
});

test("legacy profiles and sessions without drink style are treated as hot", () => {
  const legacyProfile = profile({ id: "profile-legacy", drinkStyle: undefined });
  const legacySession = session(legacyProfile, {
    id: "session-legacy",
    drinkStyle: undefined,
    recipeSnapshot: {
      ...session(legacyProfile).recipeSnapshot,
      drinkStyle: undefined,
    },
  });
  const identity = {
    ...personalEvidenceIdentityFromProfile(legacyProfile),
    drinkStyle: "hot",
  };

  assert.equal(
    matchesPersonalEvidenceIdentity(legacySession, legacyProfile, identity),
    true,
  );
});

test("matched sessions are summarized by repeated success and recency", () => {
  const hotProfile = profile();
  const first = session(hotProfile, {
    id: "session-first",
    createdAt: "2026-06-24T00:00:00Z",
  });
  const currentBest = session(hotProfile, {
    id: "session-best",
    status: "current-best",
    createdAt: "2026-06-25T00:00:00Z",
  });
  const trial = session(hotProfile, {
    id: "session-trial",
    status: "trial",
    tastingResult: undefined,
    createdAt: "2026-06-26T00:00:00Z",
  });
  const summary = summarizePersonalSessions([first, currentBest, trial]);

  assert.equal(summary.totalCount, 3);
  assert.equal(summary.successfulCount, 2);
  assert.equal(summary.hasRepeatedSuccess, true);
  assert.equal(summary.latestSession.id, "session-trial");
  assert.equal(summary.currentBestSession.id, "session-best");
});

test("removing a session immediately removes its derived observation", () => {
  const hotProfile = profile();
  const sessions = [
    session(hotProfile, { id: "session-a" }),
    session(hotProfile, { id: "session-b" }),
  ];
  const before = sessions.map((item) =>
    brewSessionToObservation(item, { bean, profile: hotProfile }),
  );
  const after = sessions
    .filter((item) => item.id !== "session-a")
    .map((item) =>
      brewSessionToObservation(item, { bean, profile: hotProfile }),
    );

  assert.equal(before.length, 2);
  assert.deepEqual(after.map((item) => item.id), ["obs:personal:session-b"]);
});
