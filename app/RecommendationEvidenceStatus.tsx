"use client";

import {
  BookOpenCheck,
  CircleAlert,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { evidenceRegistry, evidenceRegistryVersion } from "@/lib/evidence/registry";
import { assessCandidateReadiness } from "@/lib/recommendation/candidateReadiness";
import { candidateRuleRegistry } from "@/lib/recommendation/candidateRuleRegistry";
import type { BrewRecommendation } from "@/lib/types/recommendation";

interface RecommendationEvidenceStatusProps {
  recommendation: BrewRecommendation;
}

const parameterLabels: Record<string, string> = {
  dose: "원두량",
  water: "물량",
  ratio: "비율",
  temperature: "온도",
  grind: "분쇄도",
  time: "목표 시간",
  pour: "푸어 구조",
  confidence: "신뢰도",
  personalization: "개인화",
};

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
    return "초기 추천값";
  }

  return "정보 제공";
}

export default function RecommendationEvidenceStatus({
  recommendation,
}: RecommendationEvidenceStatusProps) {
  const activeRules = recommendation.appliedRules ?? [];
  const activeEvidence = activeRules.flatMap((rule) => rule.evidence);
  const activeSourceCount = new Set(
    activeEvidence.map((reference) => reference.sourceId),
  ).size;
  const activeObservationCount = new Set(
    activeEvidence
      .map((reference) => reference.observationId)
      .filter((observationId): observationId is string => Boolean(observationId)),
  ).size;

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
    <section
      aria-labelledby="recommendation-evidence-status-title"
      className="mt-5 rounded-lg border border-[#d7ded4] bg-white p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#2f6f5f]">
            <ShieldCheck aria-hidden="true" size={14} /> Evidence status
          </p>
          <h4
            id="recommendation-evidence-status-title"
            className="mt-1 text-sm font-bold"
          >
            근거 반영 현황
          </h4>
        </div>
        <span className="rounded-full bg-[#eef5ef] px-2.5 py-1 text-[11px] font-semibold text-[#2f6f5f]">
          Registry {evidenceRegistryVersion}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-[#eef5ef] p-3">
          <p className="text-xs font-semibold text-[#245647]">현재 반영</p>
          <p className="mt-1 text-lg font-bold text-[#245647]">
            활성 규칙 {activeRules.length}개
          </p>
          <p className="mt-1 text-[11px] leading-5 text-[#526055]">
            출처 {activeSourceCount}개 · Observation {activeObservationCount}개
          </p>
        </div>
        <div className="rounded-lg bg-[#fff8ee] p-3">
          <p className="text-xs font-semibold text-[#704b2d]">후보 검증</p>
          <p className="mt-1 text-lg font-bold text-[#704b2d]">
            Candidate {candidateAssessments.length}개
          </p>
          <p className="mt-1 text-[11px] leading-5 text-[#806448]">
            통과 전에는 추천 계산에 연결하지 않습니다.
          </p>
        </div>
        <div className="rounded-lg bg-[#f5f3f8] p-3">
          <p className="text-xs font-semibold text-[#5b4f69]">직접 검증 대기</p>
          <p className="mt-1 text-lg font-bold text-[#5b4f69]">
            영상 Source {sourceOnlyExpertVideos.length}개
          </p>
          <p className="mt-1 text-[11px] leading-5 text-[#6f6578]">
            Source 등록만으로는 추천값이 바뀌지 않습니다.
          </p>
        </div>
      </div>

      <details className="mt-4 rounded-lg border border-[#e2e8df] bg-[#f8faf7]">
        <summary className="cursor-pointer px-3 py-3 text-xs font-bold text-[#3f4d43]">
          현재 추천에 적용된 규칙 보기
        </summary>
        <div className="border-t border-[#e2e8df] px-3 py-3">
          {activeRules.length > 0 ? (
            <ul className="space-y-2">
              {activeRules.map((rule) => (
                <li key={`${rule.id}-${rule.version ?? 0}`}>
                  <p className="text-xs font-semibold text-[#2f6f5f]">
                    {parameterLabels[rule.parameter] ?? rule.parameter}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-[#687168]">
                    {rule.description}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs leading-5 text-[#687168]">
              이 추천에는 추적 가능한 활성 규칙 메타데이터가 없습니다.
            </p>
          )}
        </div>
      </details>

      {candidateAssessments.map(({ candidate, assessment }) => (
        <div
          key={candidate.id}
          className="mt-3 rounded-lg border border-[#ead9c7] bg-[#fff8ee] p-3"
        >
          <div className="flex items-start gap-2">
            <FlaskConical
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#8a623d]"
              size={16}
            />
            <div>
              <p className="text-xs font-bold text-[#704b2d]">
                {readinessLabel(assessment.stage)}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#806448]">
                대상: {targetLayerLabel(assessment.targetLayer)} · 신뢰도{" "}
                {assessment.metrics.confidenceScore.toFixed(2)}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#806448]">
                {candidate.hypothesis}
              </p>
              {assessment.promotionBlockers.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#806448]">
                  {assessment.promotionBlockers.slice(0, 3).map((blocker) => (
                    <li key={blocker.code}>• {blocker.message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ))}

      {sourceOnlyExpertVideos.length > 0 && (
        <div className="mt-3 rounded-lg border border-[#ddd7e4] bg-[#f5f3f8] p-3">
          <div className="flex items-start gap-2">
            <BookOpenCheck
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#5b4f69]"
              size={16}
            />
            <div>
              <p className="text-xs font-bold text-[#5b4f69]">
                직접 locator 검증 전 Source-only
              </p>
              <ul className="mt-1 space-y-1 text-xs leading-5 text-[#6f6578]">
                {sourceOnlyExpertVideos.map((source) => (
                  <li key={source.id}>• {source.title}</li>
                ))}
              </ul>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-[#6f6578]">
                <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                발언 타임스탬프, 화면 레시피 카드 또는 제작자 설명을 직접 검증한 뒤에만 Observation과 후보 규칙에 연결합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
