"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  formatRecipeWaterAmount,
  scaleRecipeValue,
} from "@/lib/recipes/recipePresentation";
import { scaleRecipeDose } from "@/lib/recipes/scaleRecipeDose";
import {
  clearBrewSessionClock,
  completeBrewSessionClock,
  getBrewSessionElapsedSeconds,
  pauseBrewSessionClock,
  readBrewSessionClock,
  resetBrewSessionClock,
  resumeBrewSessionClock,
  seekBrewSessionClock,
  startBrewSessionClock,
  subscribeToBrewSessionClock,
  type BrewSessionClock,
} from "@/lib/timer/brewSessionClock";
import {
  recommendationTimerStartEvent,
  type RecommendationTimerStartDetail,
} from "@/lib/timer/recommendationTimer";
import { runSmartAlert } from "@/lib/timer/smartAlert";
import type { Recipe } from "@/lib/types/defaultRecipe";

const mobileQuery = "(max-width: 1023px)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function clampDose(value: number) {
  if (!Number.isFinite(value)) return 8;
  return Math.min(40, Math.max(8, Math.round(value)));
}

function isDifferentTrackedRecipe(
  clock: BrewSessionClock | null,
  recipe: Recipe,
) {
  return Boolean(
    clock?.sessionId &&
      clock.status !== "completed" &&
      clock.recipe?.id !== recipe.id,
  );
}

function scrollTimerIntoView(behavior: ScrollBehavior = "smooth") {
  document.getElementById("brew-timer-panel")?.scrollIntoView({
    behavior,
    block: "start",
  });
}

function scrollTimerIntoViewOnMobile() {
  if (!window.matchMedia(mobileQuery).matches) return;

  const behavior = window.matchMedia(reducedMotionQuery).matches
    ? "auto"
    : "smooth";
  window.requestAnimationFrame(() => scrollTimerIntoView(behavior));
}

type UseBrewTimerOptions = {
  selectedRecipe: Recipe;
  onRecipeChange: (recipe: Recipe) => void;
};

export function useBrewTimer({
  selectedRecipe,
  onRecipeChange,
}: UseBrewTimerOptions) {
  const [dose, setDose] = useState(selectedRecipe.dose);
  const [doseInput, setDoseInput] = useState(String(selectedRecipe.dose));
  const [timerClock, setTimerClock] = useState<BrewSessionClock | null>(null);
  const [clockNow, setClockNow] = useState(0);
  const [timerNotice, setTimerNotice] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const previousElapsedRef = useRef(0);
  const previousStepIndexRef = useRef(0);
  const completionPlayedRef = useRef(false);

  const syncTimerDose = useCallback((nextDose: number) => {
    setDose(nextDose);
    setDoseInput(String(nextDose));
  }, []);

  const scaleFactor = dose / selectedRecipe.dose;
  const scaledWater = scaleRecipeValue(selectedRecipe.water, scaleFactor);
  const scaledFinalWater = formatRecipeWaterAmount(
    selectedRecipe.finalWater ?? selectedRecipe.water,
    scaleFactor,
  );
  const totalTime = selectedRecipe.totalTime;
  const elapsed = getBrewSessionElapsedSeconds(timerClock, clockNow);
  const running = timerClock?.status === "running";

  const currentStepIndex = useMemo(() => {
    const index = selectedRecipe.steps.findIndex((step) => elapsed < step.end);
    return index === -1 ? selectedRecipe.steps.length - 1 : index;
  }, [elapsed, selectedRecipe.steps]);

  const currentStep = selectedRecipe.steps[currentStepIndex];
  const previousTarget =
    currentStepIndex > 0
      ? selectedRecipe.steps[currentStepIndex - 1].targetWater
      : 0;
  const currentStepProgress =
    currentStep.end === currentStep.start
      ? 1
      : Math.min(
          1,
          Math.max(
            0,
            (elapsed - currentStep.start) / (currentStep.end - currentStep.start),
          ),
        );
  const targetWater = formatRecipeWaterAmount(
    currentStep.displayTargetWater ?? currentStep.targetWater,
    scaleFactor,
  );
  const scaledCurrentTarget = scaleRecipeValue(
    currentStep.targetWater,
    scaleFactor,
  );
  const scaledPreviousTarget = scaleRecipeValue(previousTarget, scaleFactor);
  const stepWater =
    currentStep.displayStepWater !== undefined
      ? formatRecipeWaterAmount(currentStep.displayStepWater, scaleFactor)
      : formatRecipeWaterAmount(scaledCurrentTarget - scaledPreviousTarget);
  const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  const remaining = Math.max(0, totalTime - elapsed);

  useEffect(() => {
    function applyClock(nextClock: BrewSessionClock | null) {
      setTimerClock(nextClock);
      setClockNow(Date.now());

      if (nextClock?.recipe) {
        onRecipeChange(nextClock.recipe as Recipe);
        syncTimerDose(nextClock.recipe.dose);
      }
    }

    const timeoutId = window.setTimeout(() => applyClock(readBrewSessionClock()), 0);
    const unsubscribe = subscribeToBrewSessionClock(applyClock);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [onRecipeChange, syncTimerDose]);

  useEffect(() => {
    if (!running) return;
    const intervalId = window.setInterval(() => setClockNow(Date.now()), 200);
    return () => window.clearInterval(intervalId);
  }, [running]);

  useEffect(() => {
    if (elapsed < totalTime) completionPlayedRef.current = false;

    if (
      running &&
      previousElapsedRef.current < totalTime &&
      elapsed >= totalTime &&
      !completionPlayedRef.current
    ) {
      completionPlayedRef.current = true;
      if (alertsEnabled) runSmartAlert();
      completeBrewSessionClock();
    }

    previousElapsedRef.current = elapsed;
  }, [alertsEnabled, elapsed, running, totalTime]);

  useEffect(() => {
    function startRecommendationTimer(event: Event) {
      const detail = (event as CustomEvent<RecommendationTimerStartDetail>).detail;
      if (!detail?.recipe) return;

      onRecipeChange(detail.recipe);
      syncTimerDose(detail.recipe.dose);
      setTimerClock(readBrewSessionClock());
      setClockNow(Date.now());
      setTimerNotice(null);
      completionPlayedRef.current = false;
      previousElapsedRef.current = 0;
      window.setTimeout(() => scrollTimerIntoView("smooth"), 0);
    }

    window.addEventListener(recommendationTimerStartEvent, startRecommendationTimer);
    return () =>
      window.removeEventListener(
        recommendationTimerStartEvent,
        startRecommendationTimer,
      );
  }, [onRecipeChange, syncTimerDose]);

  useEffect(() => {
    if (!running) {
      previousStepIndexRef.current = currentStepIndex;
      return;
    }

    if (
      alertsEnabled &&
      currentStepIndex !== previousStepIndexRef.current &&
      currentStepIndex > 0
    ) {
      runSmartAlert();
    }

    previousStepIndexRef.current = currentStepIndex;
  }, [alertsEnabled, currentStepIndex, running]);

  const updateDoseInput = useCallback((nextValue: string) => {
    setDoseInput(nextValue);
    if (nextValue === "") return;

    const nextDose = Number(nextValue);
    if (Number.isFinite(nextDose) && nextDose >= 8 && nextDose <= 40) {
      setDose(nextDose);
    }
  }, []);

  const commitDoseInput = useCallback(() => {
    syncTimerDose(clampDose(Number(doseInput)));
  }, [doseInput, syncTimerDose]);

  const toggleTimer = useCallback(() => {
    const now = Date.now();
    const current = readBrewSessionClock();

    if (isDifferentTrackedRecipe(current, selectedRecipe)) {
      setTimerNotice("진행 중인 추천 추출을 완료한 뒤 다른 레시피를 시작해 주세요.");
      return;
    }

    if (
      !current ||
      current.recipe?.id !== selectedRecipe.id ||
      current.status === "completed"
    ) {
      startBrewSessionClock(
        { recipe: scaleRecipeDose(selectedRecipe, dose) },
        now,
      );
    } else if (current.status === "running") {
      pauseBrewSessionClock(now);
    } else {
      resumeBrewSessionClock(now);
    }

    setTimerNotice(null);
  }, [dose, selectedRecipe]);

  const updateElapsed = useCallback(
    (nextElapsed: number) => {
      const now = Date.now();
      const current = readBrewSessionClock();

      if (isDifferentTrackedRecipe(current, selectedRecipe)) {
        setTimerNotice(
          "진행 중인 추천 추출에서는 현재 레시피의 단계만 이동할 수 있습니다.",
        );
        return;
      }

      if (
        !current ||
        current.recipe?.id !== selectedRecipe.id ||
        current.status === "completed"
      ) {
        startBrewSessionClock(
          { recipe: scaleRecipeDose(selectedRecipe, dose) },
          now,
        );
        pauseBrewSessionClock(now);
      }

      seekBrewSessionClock(nextElapsed, now);
      setTimerNotice(null);
      if (nextElapsed < totalTime) completionPlayedRef.current = false;
    },
    [dose, selectedRecipe, totalTime],
  );

  const selectRecipe = useCallback(
    (recipe: Recipe) => {
      const current = readBrewSessionClock();
      const sameTrackedRecipe = Boolean(
        current?.sessionId &&
          current.status !== "completed" &&
          current.recipe?.id === recipe.id,
      );

      if (sameTrackedRecipe) {
        setTimerNotice(null);
        scrollTimerIntoView("smooth");
        return;
      }

      if (isDifferentTrackedRecipe(current, recipe)) {
        setTimerNotice(
          "진행 중인 추천 추출을 완료한 뒤 다른 레시피를 선택해 주세요.",
        );
        scrollTimerIntoView("smooth");
        return;
      }

      clearBrewSessionClock();
      onRecipeChange(recipe);
      syncTimerDose(recipe.dose);
      setTimerNotice(null);
      completionPlayedRef.current = false;
      previousElapsedRef.current = 0;
      scrollTimerIntoViewOnMobile();
    },
    [onRecipeChange, syncTimerDose],
  );

  const resetTimer = useCallback(() => {
    resetBrewSessionClock();
    setTimerNotice(null);
    completionPlayedRef.current = false;
    previousElapsedRef.current = 0;
  }, []);

  const jumpToPreviousStep = useCallback(() => {
    const previousStep = selectedRecipe.steps[currentStepIndex - 1];
    updateElapsed(previousStep ? previousStep.start : 0);
  }, [currentStepIndex, selectedRecipe.steps, updateElapsed]);

  const jumpToNextStep = useCallback(() => {
    const nextStep = selectedRecipe.steps[currentStepIndex + 1];
    updateElapsed(nextStep ? nextStep.start : totalTime);
  }, [currentStepIndex, selectedRecipe.steps, totalTime, updateElapsed]);

  const blockWithNotice = useCallback((message: string) => {
    setTimerNotice(message);
    scrollTimerIntoView("smooth");
  }, []);

  const toggleAlerts = useCallback(() => {
    setAlertsEnabled((current) => !current);
  }, []);

  return {
    dose,
    doseInput,
    timerNotice,
    alertsEnabled,
    scaleFactor,
    scaledWater,
    scaledFinalWater,
    totalTime,
    elapsed,
    running,
    currentStepIndex,
    currentStep,
    currentStepProgress,
    targetWater,
    stepWater,
    progress,
    remaining,
    updateDoseInput,
    commitDoseInput,
    toggleTimer,
    updateElapsed,
    selectRecipe,
    resetTimer,
    jumpToPreviousStep,
    jumpToNextStep,
    blockWithNotice,
    toggleAlerts,
  };
}

export type BrewTimerController = ReturnType<typeof useBrewTimer>;
