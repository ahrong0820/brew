import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { advisorSourcesJamesHoffmann } from "../data/evidence/advisorSourcesJamesHoffmann.ts";
import { advisorSourcesTetsuKasuya } from "../data/evidence/advisorSourcesTetsuKasuya.ts";
import { recommendationRules } from "../data/recommendation/rules.ts";
import { v60RatioRules } from "../data/recommendation/v60RatioRules.ts";
import { v60TemperatureRules } from "../data/recommendation/v60TemperatureRules.ts";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const allRules = [
  ...recommendationRules,
  ...v60TemperatureRules,
  ...v60RatioRules,
];

test("evidence status derives complete active recommendation rule counts", () => {
  const activeRules = allRules.filter((rule) => rule.status === "active");
  const heuristicRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) => reference.sourceId.startsWith("internal:")),
  );
  const manufacturerRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) => reference.sourceId.startsWith("manufacturer:")),
  );
  const personalRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) => reference.sourceId.startsWith("local:")),
  );
  const expertRules = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) => reference.sourceId.startsWith("expert:")),
  );

  assert.equal(activeRules.length, 37);
  assert.equal(heuristicRules.length, 30);
  assert.equal(manufacturerRules.length, 5);
  assert.equal(personalRules.length, 3);
  assert.equal(expertRules.length, 5);
});

test("evidence status drawer shows active, candidate and source-only boundaries", async () => {
  const drawer = await readProjectFile("app/RecommendationEvidenceStatus.tsx");
  assert.match(drawer, /근거 반영 현황/);
  assert.match(drawer, /Source → Observation → CandidateRule → 검증 → 활성 규칙/);
  assert.match(drawer, /recommendationRuleRegistry\.rules\.filter/);
  assert.match(drawer, /assessCandidateReadiness/);
  assert.match(drawer, /candidateTitle/);
  assert.match(drawer, /활성 규칙으로 승격됨/);
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
  assert.equal(advisorSourcesJamesHoffmann[0].title, "A Better 1 Cup V60 Technique");
  assert.equal(advisorSourcesTetsuKasuya[0].title, "How to Brew Coffee Using the 4:6 Method");
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
  const [engine, adjustment, baseRules, temperatureRules, ratioRules] =
    await Promise.all([
      readProjectFile("lib/recommendation/engine.ts"),
      readProjectFile("lib/recommendation/adjustment.ts"),
      readProjectFile("data/recommendation/rules.ts"),
      readProjectFile("data/recommendation/v60TemperatureRules.ts"),
      readProjectFile("data/recommendation/v60RatioRules.ts"),
    ]);
  const activeRules = `${baseRules}\n${temperatureRules}\n${ratioRules}`;
  assert.equal(engine.includes("RecommendationEvidenceStatus"), false);
  assert.equal(engine.includes("candidateReadiness"), false);
  assert.equal(adjustment.includes("RecommendationEvidenceStatus"), false);
  assert.equal(adjustment.includes("candidateReadiness"), false);
  assert.equal(activeRules.includes("candidate:ratio:v60-hot:foundation-16-v1"), false);
  assert.equal(activeRules.includes("ratio.v60-hot-paper.foundation-16.v1"), true);
  assert.equal(activeRules.includes("temperature.v60-hot-paper.roast-only.v1"), true);
  assert.equal(activeRules.includes("grind.1zpresso-k-ultra.official-zero.v1"), true);
  assert.equal(activeRules.includes("pour.v60-hot-paper.foundation.v1"), true);
  assert.equal(activeRules.includes("time.v60-hot-paper.foundation.v1"), true);
  assert.equal(activeRules.includes("grind.v60-hot-paper.dial-in.v1"), true);
});
