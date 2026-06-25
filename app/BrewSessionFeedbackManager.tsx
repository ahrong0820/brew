"use client";

import { CheckCircle2, Clock3, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  recordBrewActualTime,
  saveBrewFeedback,
} from "@/lib/domain/brewSessionFeedback";
import {
  recommendationTimerStartEvent,
  type RecommendationTimerStartDetail,
} from "@/lib/timer/recommendationTimer";
import type { TastingResult } from "@/lib/types/coffee";

interface ActiveBrew {
  sessionId: string;
  recipeName: string;
  startedAt: number;
  targetTimeSeconds: number;
}

interface TastingOption {
  value: TastingResult;
  label: string;
  description: string;
}

const tastingOptions: TastingOption[] = [
  { value: "good", label: "좋음", description: "다시 재현하고 싶은 결과" },
  {
    value: "too-sour",
    label: "시고 덜 추출됨",
    description: "날카롭고 단맛이 충분하지 않음",
  },
  {
    value: "not-sweet-enough",
    label: "단맛 부족",
    description: "밸런스는 있으나 단맛이 약함",
  },
  {
    value: "bitter-astringent",
    label: "쓰고 떫음",
    description: "건조하고 거친 여운이 남음",
  },
  { value: "too-weak", label: "너무 연함", description: "농도와 존재감이 부족함" },
  { value: "too-strong", label: "너무 진함", description: "농도가 높고 무겁게 느껴짐" },
  {
    value: "aroma-muted",
    label: "향이 답답함",
    description: "향미가 뭉치거나 선명하지 않음",
  },
];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function BrewSessionFeedbackManager() {
  const [activeBrew, setActiveBrew] = useState<ActiveBrew | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actualTimeSeconds, setActualTimeSeconds] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [tastingResult, setTastingResult] = useState<TastingResult | undefined>();
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function handleRecommendationStart(event: Event) {
      const detail = (event as CustomEvent<RecommendationTimerStartDetail>).detail;

      if (!detail?.sessionId || !detail.recipe) {
        return;
      }

      setActiveBrew({
        sessionId: detail.sessionId,
        recipeName: detail.recipe.name,
        startedAt: Date.now(),
        targetTimeSeconds: detail.recipe.totalTime,
      });
      setElapsedSeconds(0);
      setActualTimeSeconds(null);
      setFeedbackOpen(false);
      setTastingResult(undefined);
      setNote("");
      setMinutes(0);
      setSeconds(0);
      setSaved(false);
      setMessage(null);
    }

    window.addEventListener(
      recommendationTimerStartEvent,
      handleRecommendationStart,
    );

    return () =>
      window.removeEventListener(
        recommendationTimerStartEvent,
        handleRecommendationStart,
      );
  }, []);

  useEffect(() => {
    if (!activeBrew || actualTimeSeconds !== null) {
      return;
    }

    const updateElapsed = () => {
      setElapsedSeconds((Date.now() - activeBrew.startedAt) / 1000);
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 250);
    return () => window.clearInterval(intervalId);
  }, [activeBrew, actualTimeSeconds]);

  useEffect(() => {
    if (actualTimeSeconds === null) {
      return;
    }

    setMinutes(Math.floor(actualTimeSeconds / 60));
    setSeconds(actualTimeSeconds % 60);
  }, [actualTimeSeconds]);

  useEffect(() => {
    if (!feedbackOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFeedbackOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [feedbackOpen]);

  const targetReached = useMemo(
    () =>
      activeBrew !== null &&
      actualTimeSeconds === null &&
      elapsedSeconds >= activeBrew.targetTimeSeconds,
    [activeBrew, actualTimeSeconds, elapsedSeconds],
  );

  function finishBrew() {
    if (!activeBrew) {
      return;
    }

    if (actualTimeSeconds !== null) {
      setFeedbackOpen(true);
      return;
    }

    const actual = Math.max(1, Math.round(elapsedSeconds));
    const updated = recordBrewActualTime(activeBrew.sessionId, actual);

    if (!updated) {
      setMessage("실제 추출 시간을 저장하지 못했습니다.");
      return;
    }

    setActualTimeSeconds(actual);
    setFeedbackOpen(true);
    setMessage(null);
  }

  function submitFeedback() {
    if (!activeBrew) {
      return;
    }

    const correctedActualTime = Math.max(
      1,
      Math.min(30 * 60, Math.round(minutes) * 60 + Math.round(seconds)),
    );
    const updated = saveBrewFeedback(activeBrew.sessionId, {
      actualTimeSeconds: correctedActualTime,
      tastingResult,
      note,
    });

    if (!updated) {
      setMessage("추출 결과를 저장하지 못했습니다.");
      return;
    }

    setActualTimeSeconds(updated.actualTimeSeconds ?? correctedActualTime);
    setSaved(true);
    setFeedbackOpen(false);
    setMessage("추출 결과를 저장했습니다.");
  }

  if (!activeBrew) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={finishBrew}
        className={`fixed bottom-4 left-4 z-40 flex min-h-12 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          targetReached
            ? "border-[#a84b2f] bg-[#fff0e9] text-[#8f3e27] focus:ring-[#a84b2f]"
            : actualTimeSeconds !== null
              ? "border-[#2f6f5f] bg-[#eef5ef] text-[#245647] focus:ring-[#2f6f5f]"
              : "border-[#2f6f5f] bg-white text-[#245647] focus:ring-[#2f6f5f]"
        }`}
      >
        {actualTimeSeconds === null ? (
          <Clock3 aria-hidden="true" size={18} />
        ) : (
          <CheckCircle2 aria-hidden="true" size={18} />
        )}
        <span>
          {actualTimeSeconds === null
            ? `${targetReached ? "목표 시간 도달 · " : ""}추출 완료 ${formatTime(elapsedSeconds)}`
            : `${saved ? "결과 저장됨" : "결과 입력"} · ${formatTime(actualTimeSeconds)}`}
        </span>
      </button>

      {message && !feedbackOpen && (
        <div
          role="status"
          className="fixed bottom-20 left-4 z-40 max-w-xs rounded-lg border border-[#d7ded4] bg-white px-3 py-2 text-xs text-[#526055] shadow-lg"
        >
          {message}
        </div>
      )}

      {feedbackOpen && actualTimeSeconds !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brew-feedback-title"
            className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6f5f]">
                  Brew result
                </p>
                <h2 id="brew-feedback-title" className="mt-1 text-xl font-bold">
                  추출 결과 기록
                </h2>
                <p className="mt-1 max-w-md truncate text-xs text-[#687168]">
                  {activeBrew.recipeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                aria-label="추출 결과 창 닫기"
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f]"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <section className="rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5">
                <h3 className="text-sm font-bold">실제 추출 시간</h3>
                <p className="mt-1 text-xs leading-5 text-[#687168]">
                  완료 버튼을 누른 시각이 자동 입력됩니다. 필요한 경우 직접 수정하세요.
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <label className="flex-1">
                    <span className="mb-1 block text-xs font-semibold text-[#687168]">
                      분
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={minutes}
                      onChange={(event) =>
                        setMinutes(Math.max(0, Number(event.target.value)))
                      }
                      className="h-11 w-full rounded-lg border border-[#c8d0c5] bg-white px-3 text-lg font-semibold outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                    />
                  </label>
                  <span className="pb-3 text-sm font-semibold text-[#687168]">분</span>
                  <label className="flex-1">
                    <span className="mb-1 block text-xs font-semibold text-[#687168]">
                      초
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={seconds}
                      onChange={(event) =>
                        setSeconds(
                          Math.min(59, Math.max(0, Number(event.target.value))),
                        )
                      }
                      className="h-11 w-full rounded-lg border border-[#c8d0c5] bg-white px-3 text-lg font-semibold outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                    />
                  </label>
                  <span className="pb-3 text-sm font-semibold text-[#687168]">초</span>
                </div>
              </section>

              <fieldset className="mt-5 rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5">
                <legend className="px-1 text-sm font-bold">맛 평가</legend>
                <p className="text-xs leading-5 text-[#687168]">
                  가장 가까운 결과 하나를 선택하세요. 선택하지 않고 시간만 저장해도 됩니다.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {tastingOptions.map((option) => {
                    const selected = tastingResult === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setTastingResult(option.value)}
                        className={`rounded-lg border px-3 py-3 text-left transition ${
                          selected
                            ? "border-[#2f6f5f] bg-[#eef5ef] text-[#245647]"
                            : "border-[#d7ded4] bg-white hover:bg-[#f8faf7]"
                        }`}
                      >
                        <span className="block text-sm font-bold">{option.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#687168]">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {tastingResult && (
                  <button
                    type="button"
                    onClick={() => setTastingResult(undefined)}
                    className="mt-3 text-xs font-semibold text-[#687168] underline underline-offset-2"
                  >
                    맛 평가 선택 해제
                  </button>
                )}
              </fieldset>

              <label className="mt-5 block rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5">
                <span className="text-sm font-bold">메모</span>
                <span className="mt-1 block text-xs leading-5 text-[#687168]">
                  느껴진 향미, 유속, 다음에 바꾸고 싶은 점을 간단히 적어두세요.
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="예: 식으면서 복숭아 향이 선명했고 끝맛이 조금 건조했음"
                  className="mt-3 w-full resize-y rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>

              {message && (
                <p className="mt-4 rounded-lg bg-[#fff8ee] px-3 py-2 text-sm text-[#704b2d]">
                  {message}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={submitFeedback}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2f6f5f] px-4 text-sm font-bold text-white transition hover:bg-[#25594c] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
                >
                  <Save aria-hidden="true" size={17} />
                  추출 결과 저장
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="h-11 flex-1 rounded-lg border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#526055] transition hover:bg-[#f8faf7]"
                >
                  나중에 입력
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
