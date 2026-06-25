"use client";

import { Award, Check, Copy, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  listBrewProfileHistorySummaries,
  type BrewProfileHistorySummary,
} from "@/lib/brew/history";
import { copyCurrentBestToCustomRecipe } from "@/lib/customRecipes/currentBestCopy";
import { initializeCoffeeStorage } from "@/lib/storage/coffeeData";
import type { BrewerType, TasteGoal } from "@/lib/types/coffee";

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

type CopyStatus = {
  profileId: string;
  message: string;
  success: boolean;
};

function formatTime(seconds: number | undefined) {
  if (seconds === undefined) {
    return "미기록";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function CurrentBestRecipeExporter() {
  const [open, setOpen] = useState(false);
  const [summaries, setSummaries] = useState<BrewProfileHistorySummary[]>([]);
  const [copyStatus, setCopyStatus] = useState<CopyStatus | null>(null);

  function loadBestRecipes() {
    initializeCoffeeStorage();
    setSummaries(
      listBrewProfileHistorySummaries().filter(
        (summary) => summary.currentBest !== undefined,
      ),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(loadBestRecipes, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

  const bestCount = useMemo(
    () => summaries.filter((summary) => summary.currentBest).length,
    [summaries],
  );

  function copyBest(summary: BrewProfileHistorySummary) {
    if (!summary.currentBest) {
      return;
    }

    try {
      const recipe = copyCurrentBestToCustomRecipe(
        summary.bean,
        summary.currentBest,
      );
      setCopyStatus({
        profileId: summary.profile.id,
        message: `“${recipe.name}”을 나만의 레시피에 저장했습니다.`,
        success: true,
      });
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setCopyStatus({
        profileId: summary.profile.id,
        message:
          error instanceof Error
            ? error.message
            : "나만의 레시피로 복사하지 못했습니다.",
        success: false,
      });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          loadBestRecipes();
          setCopyStatus(null);
          setOpen(true);
        }}
        className="fixed bottom-68 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#8a6d35] bg-[#fff9e9] px-4 text-sm font-semibold text-[#715927] shadow-lg transition hover:bg-[#fff3d5] focus:outline-none focus:ring-2 focus:ring-[#8a6d35] focus:ring-offset-2"
        aria-label={`현재 베스트 레시피 저장 열기, 베스트 ${bestCount}개`}
      >
        <Save aria-hidden="true" size={18} />
        베스트 저장
        {bestCount > 0 && (
          <span className="rounded-full bg-[#715927]/10 px-2 py-0.5 text-xs">
            {bestCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="best-recipe-export-title"
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6d35]">
                  Save current best
                </p>
                <h2 id="best-recipe-export-title" className="mt-1 text-xl font-bold">
                  현재 베스트를 나만의 레시피로 저장
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="베스트 저장 닫기"
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#8a6d35]"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {summaries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#c7b889] bg-white px-5 py-12 text-center">
                  <Award
                    aria-hidden="true"
                    className="mx-auto text-[#8a6d35]"
                    size={32}
                  />
                  <h3 className="mt-4 font-bold">저장할 현재 베스트가 없습니다</h3>
                  <p className="mt-2 text-sm leading-6 text-[#687168]">
                    추출 후 맛 평가를 좋음으로 기록하면 해당 조건의 현재 베스트가
                    만들어집니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summaries.map((summary) => {
                    const best = summary.currentBest;
                    if (!best) {
                      return null;
                    }

                    const status =
                      copyStatus?.profileId === summary.profile.id
                        ? copyStatus
                        : null;

                    return (
                      <article
                        key={summary.profile.id}
                        className="rounded-xl border border-[#d7c89f] bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-1.5 text-sm font-bold text-[#715927]">
                              <Award aria-hidden="true" size={15} />
                              {summary.bean.name}
                            </p>
                            <p className="mt-1 text-xs text-[#687168]">
                              {brewerLabels[summary.profile.brewerType]} · {summary.grinder?.displayName ?? "그라인더 미확인"} · {tasteLabels[summary.profile.tasteGoal]}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#fff9e9] px-2 py-1 text-xs font-semibold text-[#715927]">
                            좋음 {summary.successfulSessions.length}회
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          <span className="rounded-md bg-[#f8faf7] px-2.5 py-2">
                            {best.recipeSnapshot.grinderDisplayValue}
                          </span>
                          <span className="rounded-md bg-[#f8faf7] px-2.5 py-2">
                            {best.recipeSnapshot.temperatureCelsius}℃
                          </span>
                          <span className="rounded-md bg-[#f8faf7] px-2.5 py-2">
                            1:{best.recipeSnapshot.ratio}
                          </span>
                          <span className="rounded-md bg-[#f8faf7] px-2.5 py-2">
                            {formatTime(best.actualTimeSeconds)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyBest(summary)}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8a6d35] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#715927] focus:outline-none focus:ring-2 focus:ring-[#8a6d35] focus:ring-offset-2"
                        >
                          {status?.success ? (
                            <Check aria-hidden="true" size={17} />
                          ) : (
                            <Copy aria-hidden="true" size={17} />
                          )}
                          {status?.success
                            ? "저장 완료"
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
