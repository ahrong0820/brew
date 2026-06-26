import assert from "node:assert/strict";
import test from "node:test";

import { checkExpertVideoProvenance } from "../lib/evidence/expertVideoQuality.ts";

const source = {
  id: "expert:example:youtube-video",
  type: "expert",
  title: "Example brewing video",
  authors: [{ name: "Example Expert", role: "presenter" }],
  accessedAt: "2026-06-26",
  canonicalUrl: "https://www.youtube.com/watch?v=example123",
  identifiers: [{ scheme: "youtube", value: "example123" }],
  status: "active",
  medium: "video",
  createdAt: "2026-06-26T00:00:00Z",
  updatedAt: "2026-06-26T00:00:00Z",
};

const officialProvenance = {
  sourceId: source.id,
  channelName: "Example Expert",
  channelUrl: "https://www.youtube.com/@example",
  ownership: "expert-official",
  verificationMethod: "official-website-link",
  verifiedAt: "2026-06-26",
};

test("official expert channel video passes provenance validation", () => {
  assert.deepEqual(
    checkExpertVideoProvenance([source], [officialProvenance]),
    [],
  );
});

test("expert video requires a YouTube identifier and provenance record", () => {
  const issues = checkExpertVideoProvenance(
    [{ ...source, identifiers: [] }],
    [],
  );
  assert.deepEqual(
    issues.map((issue) => issue.code).sort(),
    ["expert-video-provenance-missing", "expert-video-youtube-id-missing"],
  );
  assert.ok(issues.some((issue) => issue.level === "error"));
});

test("third-party uploads remain visible as non-first-party warnings", () => {
  const issues = checkExpertVideoProvenance(
    [source],
    [{ ...officialProvenance, ownership: "third-party" }],
  );
  assert.deepEqual(issues.map((issue) => issue.code), [
    "expert-video-not-first-party",
  ]);
  assert.equal(issues[0].level, "warning");
});
