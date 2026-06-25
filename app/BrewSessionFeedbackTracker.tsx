"use client";

import { Check, Coffee, Save, Timer, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { discardActiveBrewSession } from "@/lib/brew/activeBrewDiscard";
import { saveBrewFeedback } from "@/lib/brew/sessionFeedback";
import { brewSessionStore } from "@/lib/storage/coffeeData";
import {
  clearBrewSessionClock,
  completeBrewSessionClock,
  getBrewSessionElapsedSeconds,
  readBrewSessionClock,
  subscribeToBrewSessionClock,
  type BrewSessionClock,
} from "@/lib/timer/brewSessionClock";
import type { TastingResult } from "@/lib/types/coffee";

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

function isTrackableClock(clock: BrewSessionClock | null) {
  if (!clock?.sessionId) {
    return false;
  }

  const storedSession = brewSessionStore.getById(clock.sessionId);
  return Boolean(storedSession && storedSession.actualTimeSeconds === undefined);
}

export default function BrewSessionFeedbackTracker() {
  const [clock, setClock] = useState<BrewSessionClock | null>(null);
  const [completed, setCompleted] = useState<CompletedSession | null>(null);
  const [now, setNow] = useState(0);
  const [tastingResult, setTastingResult] = useState<TastingResult | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const restored = readBrewSessionClock();
      if (isTrackableClock(restored)) {
        setClock(restored);
        setNow(Date.now());
      } else if (restored?.sessionId) {
        clearBrewSessionClock();
      }
    }, 0);

    const unsubscribe = subscribeToBrewSessionClock((nextClock) => {
      if (isTrackableClock(nextClock) || nextClock?.status === "completed") {
        setClock(nextClock);
        setNow(Date.now());
      } else {
        setClock(null);
      }
    });

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (clock?.status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(intervalId);
  }, [clock?.status]);

  const elapsedSeconds = useMemo(
    () => getBrewSessionElapsedSeconds(clock, now),
    [clock, now],
  );

  const active =
    clock?.sessionId && clock.status !== "completed" && isTrackableClock(clock)
      ? clock
      : null;
  const targetReached = active
    ? elapsedSeconds >= active.targetTimeSeconds
    : false;

  function clearCompletedSession(sessionId: string) {
    const current = readBrewSessionClock();
    if (current?.sessionId === sessionId) {
      clearBrewSessionClock();
    }
  }

  function dismissFeedback() {
    if (completed) {
      clearCompletedSession(completed.sessionId);
    }
    setCompleted(null);
    setMessage(null);
    setTastingResult(null);
    setNote("");
  }

  function finishBrew() {
    if (!active?.sessionId) {
      return;
    }

    try {
      const actualTimeSeconds = Math.max(1, Math.round(elapsedSeconds));
      saveBrewFeedback({
        sessionId: active.sessionId,
        actualTimeSeconds,
      });
      completeBrewSessionClock();
      setCompleted({
        sessionId: active.sessionId,
        recipeName: active.recipeName,
        actualTimeSeconds,
      });
      setMessage(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "실제 추출 시간을 저장하지 못했습니다.",
      );
    }
  }

  function requestDiscard() {
    setMessage(null);
    setDiscardOpen(true);
  }

  function closeDiscard() {
    if (!discarding) {
      setDiscardOpen(false);
      setMessage(null);
    }
  }

  function confirmDiscard() {
    if (!active?.sessionId || discarding) {
      return;
    }

    setDiscarding(true);
    setMessage(null);

    try {
      discardActiveBrewSession(active.sessionId);
      setDiscardOpen(false);
      setCompleted(null);
      setTastingResult(null);
      setNote("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "진행 중인 추출을 폐기하지 못했습니다.",
      );
    } finally {
      setDiscarding(false);
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
      window.setTimeout(dismissFeedback, 900);
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
                <Timer aria-hidden="true" size={14} />
                {active.status === "paused"
                  ? "실제 추출 시간 일시정지"
                  : "실제 추출 시간 측정 중"}
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

          <div className="mt-3">
            <p className="text-xs leading-5 text-white/75">
              {active.status === "paused"
                ? "메인 타이머에서 다시 시작하면 실제 시간 측정도 함께 재개됩니다."
                : targetReached
                  ? "목표 시간을 지났습니다. 드로다운이 끝나면 완료를 누르세요."
                  : "드로다운이 끝나는 시점에 완료를 누르세요."}
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={requestDiscard}
                className="flex h-10 items-center gap-2 rounded-lg border border-white/35 px-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <Trash2 aria-hidden="true" size={16} />
                추출 취소
              </button>
              <button
                type="button"
                onClick={finishBrew}
                className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#173d34] transition hover:bg-[#e9f2ed] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#173d34]"
              >
                <Check aria-hidden="true" size={17} />
                추출 완료
              </button>
            </div>
          </div>

          {message && (
            <p className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-xs">
              {message}
            </p>
          )}
        </div>
      )}

      {discardOpen && active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-6">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-brew-title"
            aria-describedby="discard-brew-description"
            className="w-full rounded-t-2xl bg-[#f4f6f1] p-5 shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f9e4de] text-[#9a3f2e]">
                <Trash2 aria-hidden="true" size={19} />
              </span>
              <div>
                <h2 id="discard-brew-title" className="text-lg font-bold text-[#292d28]">
                  진행 중인 추출을 폐기할까요?
                </h2>
                <p
                  id="discard-brew-description"
                  className="mt-2 text-sm leading-6 text-[#626b62]"
                >
                  타이머를 종료하고 아직 완료되지 않은 추출 기록을 삭제합니다.
                  원두와 추천 설정은 유지되며, 삭제한 기록은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#d7ded4] bg-white p-4">
              <p className="truncate text-sm font-bold text-[#294f43]">
                {active.recipeName}
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-[#173d34]">
                {formatTime(elapsedSeconds)}
              </p>
            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-[#fff0eb] px-3 py-2 text-sm text-[#8b3e2f]">
                {message}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeDiscard}
                disabled={discarding}
                className="h-11 rounded-lg border border-[#c8d0c5] bg-white px-4 text-sm font-semibold text-[#526055] hover:bg-[#f8faf7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                계속 추출
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                disabled={discarding}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#a54432] px-4 text-sm font-bold text-white hover:bg-[#8d3829] focus:outline-none focus:ring-2 focus:ring-[#a54432] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 aria-hidden="true" size={17} />
                {discarding ? "폐기 중" : "취소하고 폐기"}
              </button>
            </div>
          </section>
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
                onClick={dismissFeedback}
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
                공용 타이머에서 일시정지를 제외한 실제 경과 시간이 저장되었습니다.
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
                onClick={dismissFeedback}
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
