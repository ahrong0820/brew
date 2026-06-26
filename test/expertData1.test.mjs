import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { advisorSourceA } from "../data/evidence/advisorSourceA.ts";

test("expert batch 1 source preserves verified first-party metadata", () => {
  assert.equal(advisorSourceA.length, 1);

  const source = advisorSourceA[0];
  assert.equal(source.type, "expert");
  assert.equal(source.title, "How to Brew Better Coffee with a V60");
  assert.equal(source.publisher, "Coffee ad Astra");
  assert.equal(source.publishedAt, "2018-11-30");
  assert.equal(source.accessedAt, "2026-06-26");
  assert.match(source.canonicalUrl, /^https:\/\/coffeeadastra\.com\//);

  const notes = source.notes.join("\n");
  assert.match(notes, /expert-opinion/);
  assert.match(notes, /HOT V60/);
  assert.match(notes, /통제 실험 논문과 같은 방법론적 무게로 취급하지 않습니다/);
  assert.match(notes, /project-maintainer, 2026-06-26/);
});

test("expert batch 1 observation is scoped and connected to the registry", async () => {
  const observation = await readFile(
    new URL("../data/evidence/advisorNotesA.ts", import.meta.url),
    "utf8",
  );
  const registry = await readFile(
    new URL("../lib/evidence/registry.ts", import.meta.url),
    "utf8",
  );

  assert.match(observation, /sourceId: advisorSourceA\[0\]\.id/);
  assert.match(observation, /methodologicalStrength: "expert-opinion"/);
  assert.match(observation, /extractionConfidence: "medium"/);
  assert.match(observation, /brewerTypes: \["v60"\]/);
  assert.match(observation, /drinkStyles: \["hot"\]/);
  assert.match(observation, /filterMaterials: \["paper"\]/);
  assert.match(observation, /막힘, 채널링 또는 떫은맛 증가/);

  assert.match(
    registry,
    /import \{ advisorNotesA \} from "@\/data\/evidence\/advisorNotesA"/,
  );
  assert.match(
    registry,
    /import \{ advisorSourceA \} from "@\/data\/evidence\/advisorSourceA"/,
  );
  assert.match(registry, /\.\.\.advisorSourceA/);
  assert.match(registry, /\.\.\.advisorNotesA/);
  assert.match(registry, /evidenceRegistryVersion = "1\.4\.0"/);
});
