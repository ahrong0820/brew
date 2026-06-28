"use client";

import { CheckCircle2, History, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  listBrewProfileHistorySummaries,
  type BrewProfileHistorySummary,
} from "@/lib/brew/history";
import { restorePersonalRecipeVersion } from "@/lib/brew/personalRecipeRestore";
import { initializeCoffeeStorage } from "@/lib/storage/coffeeData";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function PersonalRecipeVersionDrawer() {
  const [open, setOpen] = useState(false);
  const [summaries, setSummaries] = useState<BrewProfileHistorySummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);

  function loadVersions() {
    initializeCoffeeStorage();
    setSummaries(
      listBrewProfileHistorySummaries().filter(
        (summary) => summary.profile.personalRecipe,
      ),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(loadVersions, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function restore(profileId: string, version: number) {
    const key = `${profileId}:${version}`;
    setRestoringKey(key);
    setMessage(null);
    try {
      restorePersonalRecipeVersion(profileId, version);
      loadVersions();
      setMessage(`개인 레시피 v${version}을 현재 베스트로 복원했습니다.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "개인 레시피 버전을 복원하지 못했습니다.",
      );
    } finally {
      setRestoringKey(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          loadVersions();
          setMessage(null);
          setOpen(true);
        }}
        className="fixed bottom-[17rem] right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#80648c] bg-[#f5eff8] px-4 text-sm font-semibold text-[#654b70] shadow-lg transition hover:bg-[#ece2f1] focus:outline-none focus:ring-2 focus:ring-[#80648c] focus:ring-offset-2"
        aria-label={`개인 레시피 버전 열기, 저장된 프로필 ${summaries.length}개`}
      >
        <History aria-hidden="true" size={18} />
        개인 레시피
        {summaries.length > 0 && (
          <span className="rounded-full bg-[#654b70]/10 px-2 py-0.5 text-xs">
            {summaries.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="personal-recipe-version-title"
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-3xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#80648c]">
                  Personal recipe history
                </p>
                <h2 id="personal-recipe-version-title" className="mt-1 text-xl font-bold">
                  개인 레시피 버전
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="개인 레시피 버전 닫기"
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#80648c]"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {message && (
                <p role="status" className="mb-4 rounded-lg bg-[#f1eaf4] px-3 py-2 text-sm text-[#654b70]">
                  {message}
                </p>
              )}

              {summaries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#aeb9ab] bg-white px-5 py-12 text-center">
                  <History className="mx-auto text-[#80648c]" size={32} />
                  <h3 className="mt-4 font-bold">아직 개인 레시피가 없습니다</h3>
                  <p className="mt-2 text-sm leading-6 text-[#687168]">
                    같은 원두·장비·맛 목표·원본 레시피에서 좋음 평가를 저장하면 v1이 생성됩니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {summaries.map((summary) => {
                    const personal = summary.profile.personalRecipe;
                    if (!personal) return null;
                    const currentVersion = personal.versions.find(
                      (version) => version.version === personal.version,
                    );
                    return (
                      <article
                        key={summary.profile.id}
                        className="rounded-xl border border-[#d7ded4] bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">{summary.bean.name}</h3>
                            <p className="mt-1 text-xs text-[#687168]">
                              {summary.profile.sourceRecipeId ?? "기본 추천"} · {summary.grinder?.displayName ?? "그라인더 미확인"}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            personal.status === "stable"
                              ? "bg-[#eaf3ee] text-[#245647]"
                              : "bg-[#fff4df] text-[#805d25]"
                          }`}>
                            {personal.status === "stable" ? "안정 개인 성공" : "잠정 개인 성공"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-[#f8faf7] p-3">
                            <p className="text-xs text-[#687168]">현재 버전</p>
                            <p className="mt-1 text-lg font-bold">v{personal.version}</p>
                          </div>
                          <div className="rounded-lg bg-[#f8faf7] p-3">
                            <p className="text-xs text-[#687168]">좋음 재현</p>
                            <p className="mt-1 text-lg font-bold">{personal.successfulBrewCount}회</p>
                          </div>
                          <div className="col-span-2 rounded-lg bg-[#f8faf7] p-3">
                            <p className="text-xs text-[#687168]">승격 조건</p>
                            <p className="mt-1 text-sm font-semibold">
                              {personal.status === "stable"
                                ? "같은 조건에서 좋음 2회 이상 재현 완료"
                                : "같은 조건에서 좋음 1회 추가 시 안정으로 승격"}
                            </p>
                          </div>
                        </div>

                        {currentVersion && (
                          <div className="mt-4 rounded-lg border border-[#ccb9d4] bg-[#faf6fc] p-3">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-[#654b70]">
                              <CheckCircle2 aria-hidden="true" size={14} /> 현재 베스트 v{currentVersion.version}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#654b70]">
                              <span className="rounded-md bg-white px-2 py-1">{currentVersion.grindDisplayValue}</span>
                              <span className="rounded-md bg-white px-2 py-1">{currentVersion.temperatureCelsius}℃</span>
                              <span className="rounded-md bg-white px-2 py-1">1:{currentVersion.ratio}</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 space-y-2">
                          {[...personal.versions]
                            .sort((left, right) => right.version - left.version)
                            .map((version) => {
                              const isCurrent = version.version === personal.version;
                              const key = `${summary.profile.id}:${version.version}`;
                              return (
                                <div
                                  key={version.version}
                                  className="rounded-lg border border-[#dde3db] bg-[#f8faf7] p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-bold">
                                        v{version.version} {isCurrent ? "· 현재" : ""}
                                      </p>
                                      <p className="mt-1 text-xs text-[#687168]">
                                        {formatDate(version.createdAt)} · 당시 좋음 {version.successfulBrewCount}회
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => restore(summary.profile.id, version.version)}
                                      disabled={isCurrent || restoringKey === key}
                                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#80648c] bg-white px-3 text-xs font-bold text-[#654b70] disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                      <RotateCcw aria-hidden="true" size={14} />
                                      {restoringKey === key ? "복원 중" : "복원"}
                                    </button>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[#687168]">
                                    <span className="rounded-md bg-white px-2 py-1">{version.grindDisplayValue}</span>
                                    <span className="rounded-md bg-white px-2 py-1">{version.temperatureCelsius}℃</span>
                                    <span className="rounded-md bg-white px-2 py-1">1:{version.ratio}</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
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
