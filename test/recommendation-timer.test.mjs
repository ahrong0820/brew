import assert from "node:assert/strict";
import test from "node:test";

import {
  dispatchRecommendationTimerStart,
  recommendationTimerStartEvent,
} from "../lib/timer/recommendationTimer.ts";

test("dispatchRecommendationTimerStart emits the expected event and detail", () => {
  const hadWindow = Object.hasOwn(globalThis, "window");
  const originalWindow = globalThis.window;
  const hadCustomEvent = Object.hasOwn(globalThis, "CustomEvent");
  const originalCustomEvent = globalThis.CustomEvent;
  const dispatchedEvents = [];

  class TestCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  globalThis.CustomEvent = TestCustomEvent;
  globalThis.window = {
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

    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0].type, recommendationTimerStartEvent);
    assert.deepEqual(dispatchedEvents[0].detail, detail);
  } finally {
    if (hadWindow) {
      globalThis.window = originalWindow;
    } else {
      delete globalThis.window;
    }

    if (hadCustomEvent) {
      globalThis.CustomEvent = originalCustomEvent;
    } else {
      delete globalThis.CustomEvent;
    }
  }
});
