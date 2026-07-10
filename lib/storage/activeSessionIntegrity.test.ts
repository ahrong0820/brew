import assert from "node:assert/strict";
import test from "node:test";

import { shouldClearActiveSessionMarker } from "./activeSessionIntegrity.ts";

test("standalone recipe timers without a session id are preserved", () => {
  assert.equal(
    shouldClearActiveSessionMarker(
      {
        version: 2,
        recipeName: "테츠 카스야 4:6 기본형",
        status: "running",
      },
      [],
    ),
    false,
  );
});

test("malformed or missing linked recommendation sessions are cleared", () => {
  assert.equal(shouldClearActiveSessionMarker(null, []), true);
  assert.equal(shouldClearActiveSessionMarker({ sessionId: 42 }, []), true);
  assert.equal(
    shouldClearActiveSessionMarker({ sessionId: "missing" }, []),
    true,
  );
});

test("active linked sessions are kept and completed ones are cleared", () => {
  assert.equal(
    shouldClearActiveSessionMarker(
      { sessionId: "active" },
      [{ id: "active" }],
    ),
    false,
  );
  assert.equal(
    shouldClearActiveSessionMarker(
      { sessionId: "done" },
      [{ id: "done", actualTimeSeconds: 210 }],
    ),
    true,
  );
});
