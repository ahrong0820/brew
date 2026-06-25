import assert from "node:assert/strict";
import test from "node:test";

import { activeBrewSessionStorageKey } from "../lib/timer/brewSessionClock.ts";
import {
  dispatchRecommendationTimerStart,
  recommendationTimerStartEvent,
} from "../lib/timer/recommendationTimer.ts";

test("dispatchRecommendationTimerStart starts the shared clock and emits the detail", () => {
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;
  const dispatchedEvents = [];
  const storedValues = new Map();

  class TestCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  globalThis.CustomEvent = TestCustomEvent;
  globalThis.window = {
    sessionStorage: {
      getItem(key) {
        return storedValues.get(key) ?? null;
      },
      setItem(key, value) {
        storedValues.set(key, String(value));
      },
      removeItem(key) {
        storedValues.delete(key);
      },
    },
    dispatchEvent(event) {
      dispatchedEvents.push(event);
      return true;
    },
  };

  const detail = {
    recipe: {
      id: "test-recipe",
      name: "테스트 레시피",
      origin: "테스트",
      method: "V60",
      profile: "균형",
      tags: ["test"],
      dose: 20,
      water: 300,
      ratio: "1:15",
      temp: "92℃",
      grind: "중간",
      totalTime: 180,
      notes: [],
      steps: [
        {
          label: "블루밍",
          start: 0,
          end: 40,
          targetWater: 40,
          cue: "전체를 적시기",
        },
      ],
    },
    sessionId: "session-1",
    isFirstSession: true,
  };

  try {
    dispatchRecommendationTimerStart(detail);

    const recommendationEvent = dispatchedEvents.find(
      (event) => event.type === recommendationTimerStartEvent,
    );
    assert.ok(recommendationEvent);
    assert.deepEqual(recommendationEvent.detail, detail);

    const storedClock = JSON.parse(
      storedValues.get(activeBrewSessionStorageKey),
    );
    assert.equal(storedClock.sessionId, detail.sessionId);
    assert.equal(storedClock.recipe.id, detail.recipe.id);
    assert.equal(storedClock.status, "running");
    assert.equal(storedClock.elapsedSeconds, 0);
  } finally {
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
  }
});
