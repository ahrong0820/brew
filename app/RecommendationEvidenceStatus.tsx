"use client";

import {
  BookOpenCheck,
  CircleAlert,
  FlaskConical,
  Library,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { recommendationRules } from "@/data/recommendation/rules";
import { evidenceRegistry, evidenceRegistryVersion } from "@/lib/evidence/registry";
import { assessCandidateReadiness } from "@/lib/recommendation/candidateReadiness";
import { candidateRuleRegistry } from "@/lib/recommendation/candidateRuleRegistry";

function readinessLabel(stage: string) {
  if (stage === "promotion-ready") {
    return "승격 검토 가능";
  }

  if (stage === "simulation-ready") {
    return "시뮬레이션 통과 · 승격 대기";
  }

  return "시뮬레이션 전 검증 필요";
}

function targetLayerLabel(targetLayer: string | null) {
  if (targetLayer === "post-brew-adjustment") {
    return "추출 후 다음 시도 조정";
  }

  if (targetLayer === "initial-recommendation") {
    return "초기 맞춤 추천값";
  }

  return "정보 제공";
}

export default function RecommendationEvidenceStatus() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const activeRules = recommendationRules.filter((rule) => rule.status === "active");
  const activeEvidence = activeRules.flatMap((rule) => rule.evidenceLinks);
  const activeSourceCount = new Set(
    activeEvidence.map((reference) => reference.sourceId),
  ).size;
  const activeObservationCount = new Set(
    activeEvidence
      .map((reference) => reference.observationId)
      .filter((observationId): observationId is string => Boolean(observationId)),
  ).size;
  const manufacturerRuleCount = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) =>
      reference.sourceId.startsWith("manufacturer:"),
    ),
  ).length;
  const personalRuleCount = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) =>
      reference.sourceId.startsWith("local:"),
    ),
  ).length;
  const heuristicRuleCount = activeRules.filter((rule) =>
    rule.evidenceLinks.some((reference) =>
      reference.sourceId.startsWith("internal:"),
    ),
  ).length;

  const observationSourceIds = new Set(
    evidenceRegistry.observations.map((observation) => observation.sourceId),
  );
  const sourceOnlyExpertVideos = evidenceRegistry.sources.filter(
    (source) =>
      source.type === "expert" &&
      source.medium === "video" &&
      !observationSourceIds.has(source.id),
  );
  const candidateAssessments = candidateRuleRegistry.rules.map((candidate) => ({
    candidate,
    assessment: assessCandidateReadiness(candidate.id),
  }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-mobile-coffee-target="evidence"
        className="fixed bottom-4 left-4 z-40 hidden h-12 items-center gap-2 rounded-full border border-[#5b4f69] bg-[#f5f3f8] px-4 text-sm font-semibold text-[#5b4f69] shadow-lg transition hover:bg-[#ece8f1] focus:outline-none focus:ring-2 focus:ring-[#5b4f69] focus:ring-offset-2 sm:flex"
      >
        <ShieldCheck aria-hidden="true" size={18} />
        근거 현황
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="근거 현황 닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="recommendation-evidence-status-title"
            className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-3xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#5b4f69]">
                  <ShieldCheck aria-hidden="true" size={14} /> Evidence status
                </p>
                <h2
                  id="recommendation-evidence-status-title"
                  className="mt-1 text-xl font-bold"
                >
                  근거 반영 현황
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="근거 현황 닫기"
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#5b4f69]"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#ddd7e4] bg-[#f5f3f8] px-3 py-2.5">
                <p className="text-xs leading-5 text-[#5b4f69]">
                  Source → Observation → CandidateRule → 검증 → 활성 규칙 순서로 반영합니다.
                </p>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5b4f69]">
                  Registry {evidenceRegistryVersion}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#c9d7c7] bg-[#eef5ef] p-3">
                  <p className="text-xs font-semibold text-[#245647]">현재 맞춤 추천 반영</p>
                  <p className="mt-1 text-lg font-bold text-[#245647]">
                    활성 규칙 {activeRules.length}개
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[#526055]">
                    출처 {activeSourceCount}개 · Observation {activeObservationCount}개
                  </p>
                </div>
                <div className="rounded-lg border border-[#ead9c7] bg-[#fff8ee] p-3">
                  <p className="text-xs font-semibold text-[#704b2d]">후보 검증</p>
                  <p className="mt-1 text-lg font-bold text-[#704b2d]">
                    Candidate {candidateAssessments.length}개
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[#806448]">
                    승격 전에는 추천 계산과 분리합니다.
                  </p>
                </div>
                <div className="rounded-lg border border-[#ddd7e4] bg-[#f5f3f8] p-3">
                  <p className="text-xs font-semibold text-[#5b4f69]">직접 검증 대기</p>
                  <p className="mt-1 text-lg font-bold text-[#5b4f69]">
                    영상 Source {sourceOnlyExpertVideos.length}개
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[#6f6578]">
                    Source 등록만으로는 수치가 바뀌지 않습니다.
                  </p>
                </div>
              </div>

              <section className="mt-4 rounded-xl border border-[#d7ded4] bg-white p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[#2f6f5f]"
                    size={17}
                  />
                  <div>
                    <h3 className="text-sm font-bold">활성 추천 규칙 구성</h3>
                    <p className="mt-1 text-xs leading-5 text-[#687168]">
                      현재 수치에는 초기 휴리스틱, 제조사 교정 자료와 사용자 추출 이력이 적용됩니다.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[#f8faf7] p-2.5">
                    <p className="text-lg font-bold text-[#2f6f5f]">{heuristicRuleCount}</p>
                    <p className="text-[11px] text-[#687168]">초기 휴리스틱 포함</p>
                  </div>
                  <div className="rounded-lg bg-[#f8faf7] p-2.5">
                    <p className="text-lg font-bold text-[#2f6f5f]">{manufacturerRuleCount}</p>
                    <p className="text-[11px] text-[#687168]">제조사 교정</p>
                  </div>
                  <div className="rounded-lg bg-[#f8faf7] p-2.5">
                    <p className="text-lg font-bold text-[#2f6f5f]">{personalRuleCount}</p>
                    <p className="text-[11px] text-[#687168]">개인화 규칙</p>
                  </div>
                </div>
                <details className="mt-3 rounded-lg border border-[#e2e8df] bg-[#f8faf7]">
                  <summary className="cursor-pointer px-3 py-3 text-xs font-bold text-[#3f4d43]">
                    활성 규칙 목록 보기
                  </summary>
                  <ul className="space-y-2 border-t border-[#e2e8df] px-3 py-3">
                    {activeRules.map((rule) => (
                      <li key={rule.id}>
                        <p className="text-xs font-semibold text-[#2f6f5f]">
                          {rule.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-[#687168]">
                          {rule.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              </section>

              {candidateAssessments.map(({ candidate, assessment }) => (
                <section
                  key={candidate.id}
                  className="mt-4 rounded-xl border border-[#ead9c7] bg-[#fff8ee] p-4"
                >
                  <div className="flex items-start gap-2">
                    <FlaskConical
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[#8a623d]"
                      size={17}
                    />
                    <div>
                      <p className="text-xs font-bold text-[#704b2d]">
                        {readinessLabel(assessment.stage)}
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-[#51351f]">
                        V60 분쇄도 다이얼인 후보
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#806448]">
                        대상: {targetLayerLabel(assessment.targetLayer)} · 신뢰도{" "}
                        {assessment.metrics.confidenceScore.toFixed(2)}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#806448]">
                        {candidate.hypothesis}
                      </p>
                      {assessment.simulation && (
                        <p className="mt-2 text-xs font-semibold text-[#704b2d]">
                          Dry-run {assessment.simulation.passedScenarios}/
                          {assessment.simulation.totalScenarios} 통과
                        </p>
                      )}
                      {assessment.promotionBlockers.length > 0 && (
                        <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#806448]">
                          {assessment.promotionBlockers.slice(0, 4).map((blocker) => (
                            <li key={blocker.code}>• {blocker.message}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              ))}

              {sourceOnlyExpertVideos.length > 0 && (
                <section className="mt-4 rounded-xl border border-[#ddd7e4] bg-[#f5f3f8] p-4">
                  <div className="flex items-start gap-2">
                    <BookOpenCheck
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[#5b4f69]"
                      size={17}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-[#5b4f69]">
                        직접 locator 검증 전 Source-only
                      </h3>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-[#6f6578]">
                        {sourceOnlyExpertVideos.map((source) => (
                          <li key={source.id}>• {source.title}</li>
                        ))}
                      </ul>
                      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-[#6f6578]">
                        <CircleAlert
                          aria-hidden="true"
                          className="mt-0.5 shrink-0"
                          size={13}
                        />
                        발언 타임스탬프, 화면 레시피 카드 또는 제작자 설명을 직접 검증한 뒤에만 Observation과 후보 규칙에 연결합니다.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <section className="mt-4 rounded-xl border border-[#d7ded4] bg-white p-4">
                <div className="flex items-start gap-2">
                  <Library
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[#4d574d]"
                    size={17}
                  />
                  <div>
                    <h3 className="text-sm font-bold">공개 레시피 라이브러리와의 구분</h3>
                    <p className="mt-1 text-xs leading-5 text-[#687168]">
                      홈의 테츠 카스야 4:6, 제임스 호프만 등 공개 레시피 카드는 참고용 레시피 라이브러리입니다. 해당 카드의 수치가 Evidence Registry에서 Observation 검수와 CandidateRule 승격을 통과했다는 뜻은 아닙니다.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
