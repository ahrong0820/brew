"use client";

import {
  Bell,
  ChevronLeft,
  Heart,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
} from "lucide-react";

import type { BrewTimerController } from "./hooks/useBrewTimer";
import { formatRecipeTime, formatRecipeWaterAmount } from "@/lib/recipes/recipePresentation";
import type { Recipe } from "@/lib/types/defaultRecipe";

type BrewTimerPanelProps = {
  selectedRecipe: Recipe;
  timer: BrewTimerController;
  selectedIsFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function BrewTimerPanel({
  selectedRecipe,
  timer,
  selectedIsFavorite,
  onToggleFavorite,
}: BrewTimerPanelProps) {
  return (
    <aside
      data-timer-panel="true"
      className="order-1 min-w-0 space-y-4 lg:sticky lg:top-6 lg:order-2 lg:self-start"
    >
      <section
        id="brew-timer-panel"
        className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[#607064]">Timer</p>
            <h2 className="mt-2 text-2xl font-semibold">{timer.currentStep.label}</h2>
          </div>
          <Timer className="h-6 w-6 text-[#2f6f5f]" aria-hidden="true" />
        </div>

        <div className="mt-6 rounded-lg bg-[#1f251f] p-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-sm text-white/62">경과</span>
              <strong className="block font-mono text-5xl">
                {formatRecipeTime(timer.elapsed)}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-sm text-white/62">목표</span>
              <strong className="block font-mono text-2xl">
                {formatRecipeTime(timer.totalTime)}
              </strong>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/16">
            <div
              className="h-full rounded-full bg-[#8bc9a4]"
              style={{ width: `${timer.progress}%` }}
            />
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={timer.toggleTimer}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-[#1f251f] transition hover:bg-[#e5eee4]"
            >
              {timer.running ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {timer.running ? "일시정지" : "시작"}
            </button>
            <button
              type="button"
              onClick={timer.jumpToPreviousStep}
              aria-label="이전 단계"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={timer.jumpToNextStep}
              aria-label="다음 단계"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={timer.resetTimer}
              aria-label="초기화"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {timer.timerNotice && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 rounded-md bg-[#fff3df] px-3 py-2 text-xs leading-5 text-[#805526]"
            >
              {timer.timerNotice}
            </p>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={timer.toggleAlerts}
            aria-pressed={timer.alertsEnabled}
            className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition ${
              timer.alertsEnabled
                ? "border-[#2f6f5f] bg-[#eef5ef] text-[#2f6f5f]"
                : "border-[#d7ded4] bg-white text-[#607064]"
            }`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            스마트 알림 {timer.alertsEnabled ? "켜짐" : "꺼짐"}
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={selectedIsFavorite}
            className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition ${
              selectedIsFavorite
                ? "border-[#c95b3d] bg-[#fff0eb] text-[#c95b3d]"
                : "border-[#d7ded4] bg-white text-[#607064]"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${selectedIsFavorite ? "fill-[#c95b3d]" : ""}`}
              aria-hidden="true"
            />
            즐겨찾기
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#607064]">
          스마트 알림은 단계 전환과 완료 시 소리를 재생하고, 지원 기기에서는
          진동으로도 안내합니다.
        </p>

        <div
          className={`mt-5 grid gap-3 ${
            selectedRecipe.brewWater ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          <label className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
            <span className="text-sm text-[#607064]">원두량</span>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={timer.doseMin}
                max={timer.doseMax}
                step="1"
                value={timer.doseInput}
                readOnly={timer.doseFixed}
                aria-readonly={timer.doseFixed}
                data-timer-dose-input="true"
                data-timer-dose-fixed={timer.doseFixed ? "true" : "false"}
                onChange={(event) => timer.updateDoseInput(event.target.value)}
                onBlur={timer.commitDoseInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    timer.commitDoseInput();
                    event.currentTarget.blur();
                  }
                }}
                className={`h-10 w-full rounded-md border border-[#d7ded4] px-3 text-lg font-semibold outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20 ${
                  timer.doseFixed
                    ? "cursor-not-allowed bg-[#edf1ea] text-[#526055]"
                    : "bg-white"
                }`}
              />
              <span className="text-sm font-semibold text-[#607064]">g</span>
            </div>
            {timer.dosePolicyNote ? (
              <span
                data-timer-dose-policy-note="true"
                className="mt-2 block text-xs leading-5 text-[#607064]"
              >
                {timer.dosePolicyNote}
              </span>
            ) : null}
          </label>

          {selectedRecipe.brewWater &&
          selectedRecipe.bypassWater !== undefined &&
          selectedRecipe.finalWater !== undefined ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                <span className="text-sm text-[#607064]">추출수</span>
                <strong className="mt-2 block text-lg">
                  {formatRecipeWaterAmount(
                    selectedRecipe.brewWater,
                    timer.scaleFactor,
                  )}
                </strong>
              </div>
              <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                <span className="text-sm text-[#607064]">후가수</span>
                <strong className="mt-2 block text-lg">
                  {formatRecipeWaterAmount(
                    selectedRecipe.bypassWater,
                    timer.scaleFactor,
                  )}
                </strong>
              </div>
              <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                <span className="text-sm text-[#607064]">최종 물</span>
                <strong className="mt-2 block text-lg">{timer.scaledFinalWater}</strong>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
              <span className="text-sm text-[#607064]">총 물량</span>
              <strong className="mt-2 block text-2xl">{timer.scaledWater}g</strong>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-sm text-[#607064]">현재 물량</span>
              <strong className="block text-3xl">{timer.targetWater}</strong>
            </div>
            <div className="text-right">
              <span className="text-sm text-[#607064]">이번 단계</span>
              <strong className="block text-2xl">+{timer.stepWater}</strong>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#d9ded6]">
            <div
              className="h-full rounded-full bg-[#c95b3d]"
              style={{ width: `${timer.currentStepProgress * 100}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#526055]">
            {timer.currentStep.cue}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[#607064]">Recipe</p>
            <h2 className="mt-2 text-xl font-semibold">{selectedRecipe.name}</h2>
          </div>
          <span className="rounded-md bg-[#eef3ec] px-3 py-1 font-mono text-sm text-[#2f6f5f]">
            {selectedRecipe.ratio}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-[#f4f6f1] p-3">
            <dt className="text-[#607064]">도구</dt>
            <dd className="mt-1 font-semibold">{selectedRecipe.method}</dd>
          </div>
          <div className="rounded-md bg-[#f4f6f1] p-3">
            <dt className="text-[#607064]">분쇄</dt>
            <dd className="mt-1 font-semibold">{selectedRecipe.grind}</dd>
          </div>
        </dl>

        <div className="mt-5 space-y-2">
          {selectedRecipe.steps
            .map((step, index) => ({ step, index }))
            .filter(({ step }) => step.end > step.start)
            .map(({ step, index }) => {
              const active = index === timer.currentStepIndex;
              const completed = timer.elapsed >= step.end;

              return (
                <button
                  key={`${selectedRecipe.id}-${index}-${step.label}`}
                  type="button"
                  onClick={() => timer.updateElapsed(step.start)}
                  className={`grid w-full grid-cols-[58px_1fr_62px] items-center gap-3 rounded-lg border p-3 text-left transition ${
                    active
                      ? "border-[#2f6f5f] bg-[#eef5ef]"
                      : completed
                        ? "border-[#d7ded4] bg-[#f8faf6] text-[#607064]"
                        : "border-[#d7ded4] bg-white"
                  }`}
                >
                  <span className="font-mono text-sm">
                    {formatRecipeTime(step.start)}
                  </span>
                  <span>
                    <strong className="block text-sm">{step.label}</strong>
                    <span className="text-xs text-[#607064]">
                      {formatRecipeTime(step.end - step.start)}
                    </span>
                  </span>
                  <span className="text-right font-semibold">
                    {formatRecipeWaterAmount(
                      step.displayTargetWater ?? step.targetWater,
                      timer.scaleFactor,
                    )}
                  </span>
                </button>
              );
            })}
        </div>

        <ul className="mt-5 space-y-2 text-sm leading-6 text-[#526055]">
          {selectedRecipe.notes.map((note) => (
            <li key={note} className="border-l-2 border-[#8bc9a4] pl-3">
              {note}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
