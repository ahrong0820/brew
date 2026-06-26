import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { recommendationRules } from "../data/recommendation/rules.ts";
import { advisorSourcesJamesHoffmann } from "../data/evidence/advisorSourcesJamesHoffmann.ts";
import { advisorSourcesTetsuKasuya } from "../data/evidence/advisorSourcesTetsuKasuya.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("evidence status derives active recommendation rule counts", () => {
  const activeRules = recommendationRules.filter((rule) => rule.status === "active");
  const heuristicRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) =>
      reference.sourceId.startsWith("internal:"),
    ),
  );
  const manufacturerRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) =>
      reference.sourceId.startsWith("manufacturer:"),
    ),
  );
  const personalRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) => reference.sourceId.startsWith("local:")),
  );
  const expertRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) => reference.sourceId.startsWith("expert:")),
  );

  assert.equal(activeRules.length, 32);
  assert.equal(heuristicRules.length, 28);
  assert.equal(manufacturerRules.length, 1);
  assert.equal(personalRules.length, 3);
  assert.equal(expertRules.length, 1);
});

test("evidence status drawer shows active, candidate and source-only boundaries", async () => {
  const drawer = await readProjectFile("app/RecommendationEvidenceStatus.tsx");

  assert.match(drawer, /근거 반영 현황/);
  assert.match(drawer, /Source → Observation → CandidateRule → 검증 → 활성 규칙/);
  assert.match(drawer, /recommendationRules\.filter/);
  assert.match(drawer, /assessCandidateReadiness/);
  assert.match(drawer, /sourceOnlyExpertVideos/);
  assert.match(drawer, /Source 등록만으로는 수치가 바뀌지 않습니다/);
  assert.match(drawer, /Dry-run/);
  assert.match(drawer, /공개 레시피 라이브러리와의 구분/);
  assert.match(drawer, /Evidence Registry에서 Observation 검수와 CandidateRule 승격/);
  assert.match(drawer, /bottom-4 left-4/);
  assert.match(drawer, /data-mobile-coffee-target="evidence"/);
});

test("known expert videos remain visible as source-only verification work", () => {
  assert.equal(advisorSourcesJamesHoffmann.length, 1);
  assert.equal(advisorSourcesTetsuKasuya.length, 1);
  assert.equal(
    advisorSourcesJamesHoffmann[0].title,
    "A Better 1 Cup V60 Technique",
  );
  assert.equal(
    advisorSourcesTetsuKasuya[0].title,
    "How to Brew Coffee Using the 4:6 Method",
  );
});

test("evidence status is mounted globally and available from mobile tools", async () => {
  const [layout, mobileNav] = await Promise.all([
    readProjectFile("app/layout.tsx"),
    readProjectFile("app/MobileCoffeeNav.tsx"),
  ]);

  assert.match(layout, /import RecommendationEvidenceStatus/);
  assert.match(layout, /<RecommendationEvidenceStatus \/>/);
  assert.match(mobileNav, /key: "evidence", label: "근거 현황"/);
  assert.match(mobileNav, /openLauncher\("evidence"\)/);
  assert.match(mobileNav, /현재 반영된 규칙과 후보·직접 검증 대기 자료/);
  assert.match(mobileNav, /max-h-\[88dvh\]/);
});

test("transparency UI does not connect candidates directly", async () => {
  const [engine, adjustment, activeRules] = await Promise.all([
    readProjectFile("lib/recommendation/engine.ts"),
    readProjectFile("lib/recommendation/adjustment.ts"),
    readProjectFile("data/recommendation/rules.ts"),
  ]);

  assert.equal(engine.includes("RecommendationEvidenceStatus"), false);
  assert.equal(engine.includes("candidateReadiness"), false);
  assert.equal(adjustment.includes("RecommendationEvidenceStatus"), false);
  assert.equal(adjustment.includes("candidateReadiness"), false);
  assert.equal(activeRules.includes("candidate:grind:v60-hot:dial-in-v1"), false);
  assert.equal(activeRules.includes("grind.v60-hot-paper.dial-in.v1"), true);
});
