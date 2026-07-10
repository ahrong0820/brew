import assert from "node:assert/strict";
import test from "node:test";
import {
  disposeSmartAlertAudio,
  playStepTone,
} from "./smartAlert.ts";

test("smart alert reuses one AudioContext and closes it on disposal", async (context) => {
  let constructed = 0;
  let closed = 0;
  let pagehideHandler;

  class FakeAudioContext {
    state = "running";
    currentTime = 0;
    destination = {};
    constructor() { constructed += 1; }
    createOscillator() {
      return {
        type: "sine",
        frequency: { value: 0 },
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
        addEventListener(_name, listener) { listener(); },
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
    }
    async resume() { this.state = "running"; }
    async close() { this.state = "closed"; closed += 1; }
  }

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      AudioContext: FakeAudioContext,
      addEventListener(name, handler) {
        if (name === "pagehide") pagehideHandler = handler;
      },
    },
  });
  context.after(async () => {
    await disposeSmartAlertAudio();
    delete globalThis.window;
  });

  assert.equal(await playStepTone(), true);
  assert.equal(await playStepTone(), true);
  assert.equal(constructed, 1);
  assert.equal(typeof pagehideHandler, "function");
  pagehideHandler();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(closed, 1);
});
