"use client";

import { ArrowRight, Check, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import AdjustmentContextPanel from "@/app/AdjustmentContextPanel";
import {
  brewFeedbackSavedEvent,
  type BrewFeedbackSavedDetail,
} from "@/lib/brew/sessionFeedback";
import { readAdjustmentContext } from "@/lib/recommendation/readAdjustmentContext";
import {
  applyBrewAdjustmentSuggestion,
  createValidatedAdjustmentSuggestion,
  type ValidatedAdjustmentSuggestion,
} from "@/lib/recommendation/validatedAdjustment";
import type { AdjustmentPresentationContext } from "@/lib/recommendation/adjustmentContext";

function formatTime(seconds: number | undefined) {
  if (seconds === undefined) return "미기록";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function NextBrewAdjustmentDrawer() {
  const [suggestion, setSuggestion] =
    useState<ValidatedAdjustmentSuggestion | null>(null);
  const [context, setContext] =
    useState<AdjustmentPresentationContext | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    function onSaved(event: Event) {
      const detail = (event as CustomEvent<BrewFeedbackSavedDetail>).detail;
      if (!detail?.sessionId) return;

      window.setTimeout(() => {
        const next = createValidatedAdjustmentSuggestion(detail.sessionId);
        if (next) {
          setSuggestion(next);
          setContext(readAdjustmentContext(next));
          setMessage(null);
          setApplied(false);
        }
      }, 1000);
    }

    window.addEventListener(brewFeedbackSavedEvent, onSaved);
    return () => window.removeEventListener(brewFeedbackSavedEvent, onSaved);
  }, []);

  function close() {
    setSuggestion(null);
    setContext(null);
    setMessage(null);
    setApplied(false);
  }

  function apply() {
    if (!suggestion) return;

    try {
      applyBrewAdjustmentSuggestion(suggestion);
      setApplied(true);
      setMessage(
        "같은 원두·장비·레시피 조건의 다음 맞춤 추천에 이 한 가지 변경을 반영했습니다.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "보정값을 저장하지 못했습니다.",
      );
    }
  }

  if (!suggestion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="next-brew-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[#f4f6f1] p-4 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a623d]">
              <SlidersHorizontal aria-hidden="true" size={14} /> Next brew
            </p>
            <h2 id="next-brew-title" className="mt-2 text-xl font-bold">
              다음 추출 조정안
            </h2>
            <p className="mt-1 text-sm text-[#687168]">
              원본 레시피 구조를 유지하고 한 번에 한 변수만 바꿉니다.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="조정안 닫기"
            className="rounded-full p-2 text-[#4d574d] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#8a623d]"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {context && (
          <AdjustmentContextPanel
            recipeName={context.recipeName}
            actualTime={formatTime(context.actualTimeSeconds)}
            targetTime={`${formatTime(context.targetTimeMinSeconds)}~${formatTime(context.targetTimeMaxSeconds)}`}
            tastingLabel={context.tastingLabel}
            stageLabel={context.personalizationStageLabel}
            stageMessage={context.personalizationMessage}
            successfulCount={context.successfulSessionCount}
            totalCount={context.totalSessionCount}
            fixedConditions={context.fixedConditions}
          />
        )}

        <div className="mt-3 rounded-xl border border-[#dccbb8] bg-white p-4">
          <p className="text-xs font-semibold text-[#8a623d]">이번에 바꿀 한 변수</p>
          <h3 className="mt-1 text-lg font-bold text-[#4f3926]">
            {suggestion.title}
          </h3>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="rounded-lg bg-[#f8faf7] p-3 text-center">
              <p className="text-xs text-[#687168]">이번 추출</p>
              <p className="mt-1 font-bold">{suggestion.currentValue}</p>
            </div>
            <ArrowRight aria-hidden="true" className="text-[#8a623d]" size={20} />
            <div className="rounded-lg bg-[#fff3e6] p-3 text-center">
              <p className="text-xs text-[#806448]">다음 추출</p>
              <p className="mt-1 font-bold text-[#5d4128]">{suggestion.nextValue}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#526055]">
            {suggestion.reason}
          </p>
          <p className="mt-3 rounded-lg bg-[#f8faf7] px-3 py-2 text-xs leading-5 text-[#687168]">
            {suggestion.instruction}
          </p>

          {suggestion.appliedRule && (
            <div className="mt-3 rounded-lg border border-[#c9d7c7] bg-[#eef5ef] px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#245647]">
                <ShieldCheck aria-hidden="true" size={14} /> 검증 완료 규칙 적용
              </p>
              <p className="mt-1 text-xs leading-5 text-[#526055]">
                {suggestion.appliedRule.description}
              </p>
              <p className="mt-1 text-[11px] text-[#687168]">
                규칙 {suggestion.appliedRule.id} · 근거 {suggestion.appliedRule.evidence.length}건
              </p>
            </div>
          )}
        </div>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              applied
                ? "bg-[#eaf3ee] text-[#245647]"
                : "bg-[#fff0e8] text-[#8a4d24]"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {suggestion.canApply && !applied ? (
            <>
              <button
                type="button"
                onClick={close}
                className="h-11 rounded-lg border border-[#c8d0c5] bg-white px-4 text-sm font-semibold text-[#526055] hover:bg-[#f8faf7]"
              >
                이번만 참고
              </button>
              <button
                type="button"
                onClick={apply}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#8a623d] px-5 text-sm font-bold text-white hover:bg-[#735033] focus:outline-none focus:ring-2 focus:ring-[#8a623d] focus:ring-offset-2"
              >
                <Check aria-hidden="true" size={17} /> 이 한 변수만 반영
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={close}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2f6f5f] px-5 text-sm font-bold text-white hover:bg-[#25594c]"
            >
              <Check aria-hidden="true" size={17} /> 확인
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
