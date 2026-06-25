"use client";

import { Check, Coffee, Save, Timer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { saveBrewFeedback } from "@/lib/brew/sessionFeedback";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import {
  recommendationTimerStartEvent,
  type RecommendationTimerStartDetail,
} from "@/lib/timer/recommendationTimer";
import type { TastingResult } from "@/lib/types/coffee";

const activeSessionStorageKey = "brew.activeRecommendationSession.v1";

type ActiveSession = {
  sessionId: string;
  recipeName: string;
  startedAt: number;
  targetTimeSeconds: number;
};

type CompletedSession = {
  sessionId: string;
  recipeName: string;
  actualTimeSeconds: number;
};

const tastingOptions: Array<{
  value: TastingResult;
  label: string;
  description: string;
}> = [
  { value: "good", label: "좋음", description: "다시 재현하고 싶은 맛" },
  { value: "too-sour", label: "시고 덜 추출됨", description: "날카롭고 단맛이 부족함" },
  { value: "not-sweet-enough", label: "단맛 부족", description: "향은 있으나 중심이 비어 있음" },
  { value: "bitter-astringent", label: "쓰고 떫음", description: "끝맛이 거칠고 건조함" },
  { value: "too-weak", label: "너무 연함", description: "농도와 바디가 부족함" },
  { value: "too-strong", label: "너무 진함", description: "농도가 높고 무거움" },
  { value: "aroma-muted", label: "향이 답답함", description: "향미가 선명하게 열리지 않음" },
];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function readActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(activeSessionStorageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ActiveSession>;
    if (
      typeof parsed.sessionId !== "string" ||
      typeof parsed.recipeName !== "string" ||
      typeof parsed.startedAt !== "number" ||
      typeof parsed.targetTimeSeconds !== "number"
    ) {
      return null;
    }

    const storedSession = brewSessionStore.getById(parsed.sessionId);
    if (!storedSession || storedSession.actualTimeSeconds !== undefined) {
      window.sessionStorage.removeItem(activeSessionStorageKey);
      return null;
    }

    return parsed as ActiveSession;
  } catch {
    return null;
  }
}

function writeActiveSession(active: ActiveSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!active) {
    window.sessionStorage.removeItem(activeSessionStorageKey);
    return;
  }

  window.sessionStorage.setItem(activeSessionStorageKey, JSON.stringify(active));
}

export default function BrewSessionFeedbackTracker() {
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [completed, setCompleted] = useState<CompletedSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [tastingResult, setTastingResult] = useState<TastingResult | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const restored = readActiveSession();
    if (restored) {
      setActive(restored);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    function startTracking(event: Event) {
      const detail = (event as CustomEvent<RecommendationTimerStartDetail>).detail;
      if (!detail?.sessionId || !detail.recipe) {
        return;
      }

      const nextActive: ActiveSession = {
        sessionId: detail.sessionId,
        recipeName: detail.recipe.name,
        startedAt: Date.now(),
        targetTimeSeconds: detail.recipe.totalTime,
      };

      setActive(nextActive);
      setCompleted(null);
      setTastingResult(null);
      setNote("");
      setMessage(null);
      setNow(Date.now());
      writeActiveSession(nextActive);
    }

    window.addEventListener(recommendationTimerStartEvent, startTracking);
    return () =>
      window.removeEventListener(recommendationTimerStartEvent, startTracking);
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [active]);

  const elapsedSeconds = useMemo(
    () =>
      active
        ? Math.max(0, Math.floor((now - active.startedAt) / 1000))
        : 0,
    [active, now],
  );

  const targetReached = active
    ? elapsedSeconds >= active.targetTimeSeconds
    : false;

  function finishBrew() {
    if (!active) {
      return;
    }

    try {
      const actualTimeSeconds = Math.max(1, elapsedSeconds);
      saveBrewFeedback({
        sessionId: active.sessionId,
        actualTimeSeconds,
      });
      const nextCompleted: CompletedSession = {
        sessionId: active.sessionId,
        recipeName: active.recipeName,
        actualTimeSeconds,
      };

      setCompleted(nextCompleted);
      setActive(null);
      setMessage(null);
      writeActiveSession(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "실제 추출 시간을 저장하지 못했습니다.",
      );
    }
  }

  function saveFeedback() {
    if (!completed || !tastingResult) {
      setMessage("맛 평가를 하나 선택해 주세요.");
      return;
    }

    try {
      saveBrewFeedback({
        sessionId: completed.sessionId,
        actualTimeSeconds: completed.actualTimeSeconds,
        tastingResult,
        note,
      });
      setMessage("실제 시간과 맛 평가를 저장했습니다.");
      window.setTimeout(() => {
        setCompleted(null);
        setMessage(null);
        setTastingResult(null);
        setNote("");
      }, 900);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "맛 평가를 저장하지 못했습니다.",
      );
    }
  }

  return (
    <>
      {active && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-2xl border border-[#315f52] bg-[#173d34] p-4 text-white shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                <Timer aria-hidden="true" size={14} /> 실제 추출 시간 측정 중
              </p>
              <p className="mt-1 truncate text-sm font-bold">{active.recipeName}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-2xl font-bold">
                {formatTime(elapsedSeconds)}
              </p>
              <p className="text-xs text-white/65">
                목표 {formatTime(active.targetTimeSeconds)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs leading-5 text-white/75">
              {targetReached
                ? "목표 시간을 지났습니다. 드로다운이 끝나면 완료를 누르세요."
                : "드로다운이 끝나는 시점에 완료를 누르세요."}
            </p>
            <button
              type="button"
              onClick={finishBrew}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#173d34] transition hover:bg-[#e9f2ed] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#173d34]"
            >
              <Check aria-hidden="true" size={17} />
              추출 완료
            </button>
          </div>

          {message && (
            <p className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-xs">
              {message}
            </p>
          )}
        </div>
      )}

      {completed && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brew-feedback-title"
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[#f4f6f1] p-4 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f6f5f]">
                  <Coffee aria-hidden="true" size={14} /> Brew feedback
                </p>
                <h2 id="brew-feedback-title" className="mt-2 text-xl font-bold">
                  추출 결과 기록
                </h2>
                <p className="mt-1 text-sm text-[#687168]">
                  {completed.recipeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompleted(null)}
                aria-label="추출 결과 기록 닫기"
                className="rounded-full p-2 text-[#4d574d] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f5f]"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-[#c9d7c7] bg-white p-4">
              <p className="text-xs text-[#687168]">실제 추출 시간</p>
              <p className="mt-1 font-mono text-3xl font-bold text-[#214f42]">
                {formatTime(completed.actualTimeSeconds)}
              </p>
              <p className="mt-1 text-xs text-[#687168]">
                완료 버튼을 누른 시점이 해당 세션에 저장되었습니다.
              </p>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-bold">맛은 어땠나요?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {tastingOptions.map((option) => {
                  const selected = tastingResult === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setTastingResult(option.value);
                        setMessage(null);
                      }}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[#2f6f5f] bg-[#eaf3ee] text-[#214f42]"
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
            </fieldset>

            <label className="mt-5 block">
              <span className="text-sm font-bold">메모</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="향미, 온도 변화, 유속 등 다음 추출에 참고할 내용을 적어 주세요."
                className="mt-2 w-full rounded-xl border border-[#c8d0c5] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
              />
            </label>

            {message && (
              <p className="mt-4 rounded-lg bg-[#fff8ee] px-3 py-2 text-sm text-[#704b2d]">
                {message}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCompleted(null)}
                className="h-11 rounded-lg border border-[#c8d0c5] bg-white px-4 text-sm font-semibold text-[#526055] hover:bg-[#f8faf7]"
              >
                평가는 나중에
              </button>
              <button
                type="button"
                onClick={saveFeedback}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2f6f5f] px-5 text-sm font-bold text-white hover:bg-[#25594c] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
              >
                <Save aria-hidden="true" size={17} />
                평가 저장
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
