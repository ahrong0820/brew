import assert from "node:assert/strict";
import test from "node:test";

import {
  completeBrewSessionClock,
  getBrewSessionElapsedSeconds,
  pauseBrewSessionClock,
  readBrewSessionClock,
  resetBrewSessionClock,
  resumeBrewSessionClock,
  seekBrewSessionClock,
  startBrewSessionClock,
} from "../lib/timer/brewSessionClock.ts";

const recipe = {
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
};

function withBrowserMock(run) {
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;
  const values = new Map();

  globalThis.CustomEvent = class {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
    dispatchEvent: () => true,
  };

  try {
    run();
  } finally {
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
  }
}

test("shared clock excludes paused time and keeps all timer transitions aligned", () => {
  withBrowserMock(() => {
    let clock = startBrewSessionClock(
      { recipe, sessionId: "session-1", isFirstSession: true },
      1_000,
    );
    assert.equal(getBrewSessionElapsedSeconds(clock, 3_000), 2);

    clock = pauseBrewSessionClock(3_000);
    assert.equal(clock.status, "paused");
    assert.equal(getBrewSessionElapsedSeconds(clock, 9_000), 2);

    clock = resumeBrewSessionClock(10_000);
    assert.equal(getBrewSessionElapsedSeconds(clock, 11_500), 3.5);

    clock = seekBrewSessionClock(60, 12_000);
    assert.equal(getBrewSessionElapsedSeconds(clock, 13_000), 61);

    clock = resetBrewSessionClock(14_000);
    assert.equal(clock.status, "paused");
    assert.equal(getBrewSessionElapsedSeconds(clock, 20_000), 0);

    seekBrewSessionClock(42, 21_000);
    resumeBrewSessionClock(22_000);
    clock = completeBrewSessionClock(25_000);
    assert.equal(clock.status, "completed");
    assert.equal(clock.elapsedSeconds, 45);
  });
});

test("shared clock keeps working when session storage is unavailable", () => {
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;

  globalThis.CustomEvent = class {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.window = {
    sessionStorage: {
      getItem() {
        throw new Error("storage unavailable");
      },
      setItem() {
        throw new Error("storage unavailable");
      },
      removeItem() {
        throw new Error("storage unavailable");
      },
    },
    dispatchEvent: () => true,
  };

  try {
    startBrewSessionClock({ recipe, sessionId: "memory-session" }, 1_000);
    assert.equal(readBrewSessionClock().sessionId, "memory-session");

    const paused = pauseBrewSessionClock(4_000);
    assert.equal(paused.status, "paused");
    assert.equal(paused.elapsedSeconds, 3);
  } finally {
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
  }
});
