import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audit = await readFile(
  new URL(
    "../docs/source-audits/clever-official-distributor-185.md",
    import.meta.url,
  ),
  "utf8",
);

test("Clever exact audit records the verified source values", () => {
  for (const expected of [
    "18.5g",
    "310g",
    "1:16.75",
    "100℃",
    "1:10",
    "2:30",
    "2:45",
    "`exact`",
    "`verified`",
  ]) {
    assert.match(audit, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
