"use client";

import {
  Award,
  Check,
  Clock3,
  Copy,
  History,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { brewFeedbackSavedEvent } from "@/lib/brew/sessionFeedback";
import {
  listBrewProfileHistorySummaries,
  type BrewProfileHistorySummary,
} from "@/lib/brew/history";
import { copyCurrentBestToCustomRecipe } from "@/lib/customRecipes/currentBestCopy";
import { initializeCoffeeStorage } from "@/lib/storage/coffeeData";
import type {
  BrewerType,
  RecommendationConfidence,
  TasteGoal,
} from "@/lib/types/coffee";

const brewerLabels: Record<BrewerType, string> = {
  v60: "V60",
  clever: "클레버",
  switch: "하리오 스위치",
  other: "기타 드리퍼",
};

const tasteLabels: Record<TasteGoal, string> = {
  sweet: "단맛",
  bright: "산미·향미",
  balanced: "밸런스",
  body: "바디감",
};

const confidenceLabels: Record<RecommendationConfidence, string> = {
  high: "높음",
  medium: "보통",
  reference: "기록 없음",
};

function formatTime(seconds: number | undefined) {
  if (seconds === undefined) {
    return "미기록";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

type CopyStatus = {
  profileId: string;
  message: string;
  success: boolean;
};

export default function BrewHistoryDrawer() {
  const [open, setOpen] = useState(false);
  const [summaries, setSummaries] = useState<BrewProfileHistorySummary[]>([]);
  const [copyStatus, setCopyStatus] = useState<CopyStatus | null>(null);

  function loadHistory() {
    initializeCoffeeStorage();
    setSummaries(listBrewProfileHistorySummaries());
  }

  useEffect(() => {
    const timer = window.setTimeout(loadHistory, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function refreshHistory() {
      if (open) {
        loadHistory();
      }
    }

    window.addEventListener(brewFeedbackSavedEvent, refreshHistory);
    return () => window.removeEventListener(brewFeedbackSavedEvent, refreshHistory);
  }, [open]);

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

  function copyBest(summary: BrewProfileHistorySummary) {
    if (!summary.currentBest) {
      return;
    }

    try {
      const result = copyCurrentBestToCustomRecipe(
        summary.bean,
        summary.currentBest,
      );
      const actionMessage =
        result.copyAction === "updated"
          ? "기존 베스트 레시피를 최신 조건으로 갱신했습니다."
          : result.copyAction === "unchanged"
            ? "같은 현재 베스트가 이미 나만의 레시피에 저장되어 있습니다."
            : "현재 베스트를 나만의 레시피에 저장했습니다.";

      setCopyStatus({
        profileId: summary.profile.id,
        message: actionMessage,
        success: true,
      });

      if (result.copyAction !== "unchanged") {
        window.setTimeout(() => window.location.reload(), 900);
      }
    } catch (error) {
      setCopyStatus({
        profileId: summary.profile.id,
        message:
          error instanceof Error
            ? error.message
            : "나만의 레시피로 저장하지 못했습니다.",
        success: false,
      });
    }
  }

  const sessionCount = summaries.reduce(
    (total, summary) => total + summary.sessions.length,
    0,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          loadHistory();
          setCopyStatus(null);
          setOpen(true);
        }}
        className="fixed bottom-52 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#586a80] bg-[#edf2f7] px-4 text-sm font-semibold text-[#40536a] shadow-lg transition hover:bg-[#e1e9f1] focus:outline-none focus:ring-2 focus:ring-[#586a80] focus:ring-offset-2"
        aria-label={`추출 기록 열기, 저장된 추출 ${sessionCount}회`}
      >
        <History aria-hidden="true" size={18} />
        추출 기록
        {sessionCount > 0 && (
          <span className="rounded-full bg-[#40536a]/10 px-2 py-0.5 text-xs">
            {sessionCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brew-history-title"
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-3xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#586a80]">
                  Brew history
                </p>
                <h2 id="brew-history-title" className="mt-1 text-xl font-bold">
                  원두별 추출 기록
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="추출 기록 닫기"
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#586a80]"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {summaries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#aeb9ab] bg-white px-5 py-12 text-center">
                  <History
                    aria-hidden="true"
                    className="mx-auto text-[#586a80]"
                    size={32}
                  />
                  <h3 className="mt-4 font-bold">아직 추출 기록이 없습니다</h3>
                  <p className="mt-2 text-sm leading-6 text-[#687168]">
                    맞춤 추천에서 타이머를 시작하고 실제 시간과 맛을 평가하면
                    이곳에 조건별 기록이 쌓입니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {summaries.map((summary) => {
                    const best = summary.currentBest;
                    const status =
                      copyStatus?.profileId === summary.profile.id
                        ? copyStatus
                        : null;

                    return (
                      <article
                        key={summary.profile.id}
                        className="rounded-xl border border-[#d7ded4] bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">{summary.bean.name}</h3>
                            <p className="mt-1 text-xs text-[#687168]">
                              {brewerLabels[summary.profile.brewerType]} · {summary.grinder?.displayName ?? "그라인더 미확인"} · {tasteLabels[summary.profile.tasteGoal]}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#edf2f7] px-2.5 py-1 text-xs font-semibold text-[#40536a]">
                            기록 신뢰도 {confidenceLabels[summary.historyConfidence]}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-[#f8faf7] p-3">
                            <p className="text-xs text-[#687168]">전체 추출</p>
                            <p className="mt-1 text-lg font-bold">
                              {summary.sessions.length}회
                            </p>
                          </div>
                          <div className="rounded-lg bg-[#f8faf7] p-3">
                            <p className="text-xs text-[#687168]">좋음 평가</p>
                            <p className="mt-1 text-lg font-bold">
                              {summary.successfulSessions.length}회
                            </p>
                          </div>
                          <div className="col-span-2 rounded-lg bg-[#f8faf7] p-3 sm:col-span-1">
                            <p className="text-xs text-[#687168]">최근 추출</p>
                            <p className="mt-1 text-sm font-bold">
                              {summary.sessions[0]
                                ? formatDate(summary.sessions[0].createdAt)
                                : "없음"}
                            </p>
                          </div>
                        </div>

                        {best ? (
                          <div className="mt-4 rounded-lg border border-[#d7c89f] bg-[#fff9e9] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="flex items-center gap-1.5 text-sm font-bold text-[#715927]">
                                <Award aria-hidden="true" size={16} /> 현재 베스트
                              </p>
                              <span className="text-xs text-[#806b3f]">
                                {formatDate(best.updatedAt)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[#4f4126]">
                              {best.recipeSnapshot.sourceTemplateName}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                              <span className="rounded-md bg-white/70 px-2.5 py-2">
                                {best.recipeSnapshot.grinderDisplayValue}
                              </span>
                              <span className="rounded-md bg-white/70 px-2.5 py-2">
                                {best.recipeSnapshot.temperatureCelsius}℃
                              </span>
                              <span className="rounded-md bg-white/70 px-2.5 py-2">
                                1:{best.recipeSnapshot.ratio}
                              </span>
                              <span className="flex items-center gap-1 rounded-md bg-white/70 px-2.5 py-2">
                                <Clock3 aria-hidden="true" size={13} /> {formatTime(best.actualTimeSeconds)}
                              </span>
                            </div>
                            {best.note && (
                              <p className="mt-3 text-xs leading-5 text-[#6f603e]">
                                {best.note}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => copyBest(summary)}
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#8a6d35] bg-white px-4 py-2.5 text-sm font-bold text-[#715927] transition hover:bg-[#fff4d4] focus:outline-none focus:ring-2 focus:ring-[#8a6d35] focus:ring-offset-2"
                            >
                              {status?.success ? (
                                <Check aria-hidden="true" size={17} />
                              ) : (
                                <Copy aria-hidden="true" size={17} />
                              )}
                              {status?.success
                                ? "나만의 레시피 저장 확인"
                                : "나만의 레시피로 저장"}
                            </button>

                            {status && (
                              <p
                                role="status"
                                className={`mt-2 rounded-lg px-3 py-2 text-xs leading-5 ${
                                  status.success
                                    ? "bg-[#eef5ef] text-[#245647]"
                                    : "bg-[#fff0e8] text-[#8a4d24]"
                                }`}
                              >
                                {status.message}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 flex gap-2 rounded-lg bg-[#f8faf7] p-4 text-xs leading-5 text-[#687168]">
                            <Sparkles
                              aria-hidden="true"
                              className="mt-0.5 shrink-0"
                              size={15}
                            />
                            아직 좋음 평가가 없습니다. 좋은 결과를 기록하면 가장 최근
                            성공 세션이 현재 베스트가 됩니다.
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
