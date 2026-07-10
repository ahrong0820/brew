"use client";

import {
  Bell,
  ChevronLeft,
  Check,
  Coffee,
  Droplets,
  Heart,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Search,
  SkipForward,
  Thermometer,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearBrewSessionClock,
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

import { defaultRecipes } from "@/data/defaultRecipes";
import {
  repairStoredCustomRecipeStorage,
  customRecipesStorageKey,
} from "@/lib/recipes/customRecipeSchema";
import { recipeTemperaturePresentation } from "@/lib/recipes/recipeTemperature";
import { writeJsonStorage } from "@/lib/storage/browserJsonStorage";
import { runSmartAlert } from "@/lib/timer/smartAlert";
import type { Recipe, WaterAmount } from "@/lib/types/defaultRecipe";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const heroImageSrc = `${basePath}/brewing-hero.png`;

type DraftStep = {
  label: string;
  duration: number;
  targetWater: number;
  cue: string;
};

const defaultDraftSteps: DraftStep[] = [
  {
    label: "블루밍",
    duration: 40,
    targetWater: 40,
    cue: "가루 전체를 적시고 향을 열기",
  },
  {
    label: "1차 추출",
    duration: 35,
    targetWater: 120,
    cue: "중앙부터 바깥쪽으로 천천히 붓기",
  },
  {
    label: "2차 추출",
    duration: 35,
    targetWater: 200,
    cue: "수위를 안정적으로 유지하며 붓기",
  },
  {
    label: "마무리",
    duration: 50,
    targetWater: 300,
    cue: "목표 물량까지 채우고 드리퍼 제거 준비",
  },
];

const recipes: readonly Recipe[] = defaultRecipes;

const filterOptions = [
  "전체",
  "즐겨찾기",
  "나만의 레시피",
  "V60",
  "클레버",
  "스위치",
  "라이트",
  "단맛",
];

function getStoredFavorites() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem("coffee-recipe-favorites");
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function createDefaultDraftSteps() {
  return defaultDraftSteps.map((step) => ({ ...step }));
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function formatRatio(dose: number, water: number) {
  const ratio = water / dose;
  return `1:${ratio.toFixed(1).replace(".0", "")}`;
}

function buildBrewSteps(draftSteps: DraftStep[]) {
  let cursor = 0;
  let previousTargetWater = 0;

  return draftSteps.map((step, index) => {
    const duration = clampNumber(step.duration, 5, 360);
    const start = cursor;
    const end = cursor + duration;
    const targetWater = Math.max(
      previousTargetWater,
      clampNumber(step.targetWater, 0, 1200),
    );
    const brewStep = {
      label: step.label.trim() || `${index + 1}단계`,
      start,
      end,
      targetWater,
      cue: step.cue.trim() || "다음 단계로 넘어가기 전 흐름을 확인",
    };

    cursor = end;
    previousTargetWater = targetWater;
    return brewStep;
  });
}

function getStoredCustomRecipes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return repairStoredCustomRecipeStorage(window.localStorage).recipes;
  } catch {
    return [];
  }
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function scaleValue(value: number, factor: number) {
  return Math.round(value * factor);
}

function formatWaterAmount(amount: WaterAmount, factor = 1) {
  if (typeof amount === "number") {
    return `${scaleValue(amount, factor)}g`;
  }

  return `${scaleValue(amount.min, factor)}-${scaleValue(amount.max, factor)}g`;
}

export default function Home() {
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [recommendedRecipe, setRecommendedRecipe] = useState<Recipe | null>(null);
  const [selectedId, setSelectedId] = useState(recipes[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const [dose, setDose] = useState(recipes[0].dose);
  const [doseInput, setDoseInput] = useState(String(recipes[0].dose));
  const [timerClock, setTimerClock] = useState<BrewSessionClock | null>(null);
  const [clockNow, setClockNow] = useState(0);
  const [timerNotice, setTimerNotice] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [draftName, setDraftName] = useState("오전용 V60 레시피");
  const [draftMethod, setDraftMethod] = useState("V60");
  const [draftProfile, setDraftProfile] = useState("직접 만든 추출 흐름");
  const [draftDose, setDraftDose] = useState(20);
  const [draftTemp, setDraftTemp] = useState("92C");
  const [draftGrind, setDraftGrind] = useState("중간 분쇄");
  const [draftSteps, setDraftSteps] =
    useState<DraftStep[]>(createDefaultDraftSteps);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [storageErrors, setStorageErrors] = useState<{
    favorites: string | null;
    customRecipes: string | null;
  }>({ favorites: null, customRecipes: null });
  const previousElapsedRef = useRef(0);
  const previousStepIndexRef = useRef(0);
  const completionPlayedRef = useRef(false);
  const allRecipes = useMemo(
    () => [
      ...(recommendedRecipe ? [recommendedRecipe] : []),
      ...customRecipes,
      ...recipes,
    ],
    [customRecipes, recommendedRecipe],
  );

  const selectedRecipe =
    allRecipes.find((recipe) => recipe.id === selectedId) ?? allRecipes[0];

  const scaleFactor = dose / selectedRecipe.dose;
  const scaledWater = scaleValue(selectedRecipe.water, scaleFactor);
  const scaledFinalWater = formatWaterAmount(
    selectedRecipe.finalWater ?? selectedRecipe.water,
    scaleFactor,
  );
  const totalTime = selectedRecipe.totalTime;
  const elapsed = getBrewSessionElapsedSeconds(timerClock, clockNow);
  const running = timerClock?.status === "running";

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allRecipes.filter((recipe) => {
      const matchesFilter =
        filter === "전체" ||
        (filter === "즐겨찾기" && favoriteIds.includes(recipe.id)) ||
        recipe.tags.some((tag) => tag.toLowerCase() === filter.toLowerCase());
      const searchable = [
        recipe.name,
        recipe.origin,
        recipe.method,
        recipe.profile,
        ...recipe.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchable.includes(normalizedQuery);
    });
  }, [allRecipes, favoriteIds, filter, query]);

  const storageNotice = storageErrors.favorites ?? storageErrors.customRecipes;

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
          Math.max(0, (elapsed - currentStep.start) / (currentStep.end - currentStep.start)),
        );
  const targetWater = formatWaterAmount(
    currentStep.displayTargetWater ?? currentStep.targetWater,
    scaleFactor,
  );
  const stepWater = formatWaterAmount(
    currentStep.displayStepWater ?? currentStep.targetWater - previousTarget,
    scaleFactor,
  );
  const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  const remaining = Math.max(0, totalTime - elapsed);
  const selectedIsFavorite = favoriteIds.includes(selectedRecipe.id);
  const lastDraftStep = draftSteps[draftSteps.length - 1];
  const draftTotalWater = lastDraftStep?.targetWater ?? 0;
  const draftTotalTime = draftSteps.reduce(
    (total, step) => total + clampNumber(step.duration, 5, 360),
    0,
  );

  function syncTimerDose(nextDose: number) {
    setDose(nextDose);
    setDoseInput(String(nextDose));
  }

  function updateTimerDoseInput(nextValue: string) {
    setDoseInput(nextValue);
    if (nextValue === "") {
      return;
    }

    const nextDose = Number(nextValue);
    if (Number.isFinite(nextDose) && nextDose >= 8 && nextDose <= 40) {
      setDose(nextDose);
    }
  }

  function commitTimerDoseInput() {
    syncTimerDose(clampNumber(Number(doseInput), 8, 40));
  }

  useEffect(() => {
    function applyClock(nextClock: BrewSessionClock | null) {
      setTimerClock(nextClock);
      setClockNow(Date.now());

      if (nextClock?.recipe) {
        if (nextClock.recipe.id.startsWith("recommendation-")) {
          setRecommendedRecipe(nextClock.recipe as Recipe);
        }
        setSelectedId(nextClock.recipe.id);
        syncTimerDose(nextClock.recipe.dose);
      }
    }

    const timeoutId = window.setTimeout(() => {
      applyClock(readBrewSessionClock());
    }, 0);
    const unsubscribe = subscribeToBrewSessionClock(applyClock);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!running) {
      return;
    }

    const intervalId = window.setInterval(() => setClockNow(Date.now()), 200);
    return () => window.clearInterval(intervalId);
  }, [running]);

  useEffect(() => {
    if (elapsed < totalTime) {
      completionPlayedRef.current = false;
    }

    if (
      running &&
      previousElapsedRef.current < totalTime &&
      elapsed >= totalTime &&
      !completionPlayedRef.current
    ) {
      completionPlayedRef.current = true;
      if (alertsEnabled) {
        runSmartAlert();
      }
    }

    previousElapsedRef.current = elapsed;
  }, [alertsEnabled, elapsed, running, totalTime]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFavoriteIds(getStoredFavorites());
      setCustomRecipes(getStoredCustomRecipes());
      setStorageLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function startRecommendationTimer(event: Event) {
      const detail = (event as CustomEvent<RecommendationTimerStartDetail>).detail;

      if (!detail?.recipe) {
        return;
      }

      setRecommendedRecipe(detail.recipe);
      setSelectedId(detail.recipe.id);
      syncTimerDose(detail.recipe.dose);
      setTimerClock(readBrewSessionClock());
      setClockNow(Date.now());
      setTimerNotice(null);
      completionPlayedRef.current = false;
      previousElapsedRef.current = 0;

      window.setTimeout(() => {
        document.getElementById("brew-timer-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    }

    window.addEventListener(
      recommendationTimerStartEvent,
      startRecommendationTimer,
    );
    return () =>
      window.removeEventListener(
        recommendationTimerStartEvent,
        startRecommendationTimer,
      );
  }, []);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    const result = writeJsonStorage(
      window.localStorage,
      "coffee-recipe-favorites",
      favoriteIds,
    );
    setStorageErrors((current) => ({
      ...current,
      favorites: result.ok
        ? null
        : "즐겨찾기를 브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.",
    }));
  }, [favoriteIds, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    const result = writeJsonStorage(
      window.localStorage,
      customRecipesStorageKey,
      customRecipes,
    );
    setStorageErrors((current) => ({
      ...current,
      customRecipes: result.ok
        ? null
        : "나만의 레시피를 브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.",
    }));
  }, [customRecipes, storageLoaded]);

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

  function toggleTimer() {
    const now = Date.now();
    const current = readBrewSessionClock();

    if (isDifferentTrackedRecipe(current, selectedRecipe)) {
      setTimerNotice("진행 중인 추천 추출을 완료한 뒤 다른 레시피를 시작해 주세요.");
      return;
    }

    if (!current || current.recipe?.id !== selectedRecipe.id || current.status === "completed") {
      startBrewSessionClock({ recipe: selectedRecipe }, now);
    } else if (current.status === "running") {
      pauseBrewSessionClock(now);
    } else {
      resumeBrewSessionClock(now);
    }

    setTimerNotice(null);
  }

  function updateElapsed(nextElapsed: number) {
    const now = Date.now();
    const current = readBrewSessionClock();

    if (isDifferentTrackedRecipe(current, selectedRecipe)) {
      setTimerNotice("진행 중인 추천 추출에서는 현재 레시피의 단계만 이동할 수 있습니다.");
      return;
    }

    if (!current || current.recipe?.id !== selectedRecipe.id || current.status === "completed") {
      startBrewSessionClock({ recipe: selectedRecipe }, now);
      pauseBrewSessionClock(now);
    }

    seekBrewSessionClock(nextElapsed, now);
    setTimerNotice(null);
    if (nextElapsed < totalTime) {
      completionPlayedRef.current = false;
    }
  }

  function selectRecipe(recipe: Recipe) {
    const current = readBrewSessionClock();
    const sameTrackedRecipe = Boolean(
      current?.sessionId &&
        current.status !== "completed" &&
        current.recipe?.id === recipe.id,
    );

    if (sameTrackedRecipe) {
      setTimerNotice(null);
      document.getElementById("brew-timer-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (isDifferentTrackedRecipe(current, recipe)) {
      setTimerNotice("진행 중인 추천 추출을 완료한 뒤 다른 레시피를 선택해 주세요.");
      document.getElementById("brew-timer-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    clearBrewSessionClock();
    setSelectedId(recipe.id);
    syncTimerDose(recipe.dose);
    setTimerNotice(null);
    completionPlayedRef.current = false;
    previousElapsedRef.current = 0;
  }

  function toggleFavorite(recipeId: string) {
    setFavoriteIds((currentIds) =>
      currentIds.includes(recipeId)
        ? currentIds.filter((id) => id !== recipeId)
        : [...currentIds, recipeId],
    );
  }

  function updateDraftStep(index: number, patch: Partial<DraftStep>) {
    setDraftSteps((currentSteps) =>
      currentSteps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
      ),
    );
  }

  function addDraftStep() {
    const lastStep = draftSteps[draftSteps.length - 1];
    const nextIndex = draftSteps.length + 1;

    setDraftSteps((currentSteps) => [
      ...currentSteps,
      {
        label: `${nextIndex}차 추출`,
        duration: 30,
        targetWater: (lastStep?.targetWater ?? 0) + 60,
        cue: "목표 물량까지 일정하게 붓기",
      },
    ]);
  }

  function removeDraftStep(index: number) {
    setDraftSteps((currentSteps) =>
      currentSteps.length === 1
        ? currentSteps
        : currentSteps.filter((_, stepIndex) => stepIndex !== index),
    );
  }

  function resetDraft() {
    setDraftName("오전용 V60 레시피");
    setDraftMethod("V60");
    setDraftProfile("직접 만든 추출 흐름");
    setDraftDose(20);
    setDraftTemp("92C");
    setDraftGrind("중간 분쇄");
    setDraftSteps(createDefaultDraftSteps());
  }

  function saveCustomRecipe() {
    const activeClock = readBrewSessionClock();
    if (activeClock?.sessionId && activeClock.status !== "completed") {
      setTimerNotice(
        "진행 중인 추천 추출을 완료한 뒤 나만의 레시피를 저장해 주세요.",
      );
      document.getElementById("brew-timer-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    const safeDose = clampNumber(draftDose, 8, 60);
    const steps = buildBrewSteps(draftSteps);
    const lastStep = steps[steps.length - 1];
    const water = lastStep?.targetWater ?? 0;
    const totalTime = lastStep?.end ?? 0;
    const method = draftMethod.trim() || "핸드드립";
    const nextCustomRecipeIndex =
      customRecipes.reduce((highestIndex, recipe) => {
        const recipeIndex = Number(recipe.id.replace("custom-", ""));
        return Number.isFinite(recipeIndex)
          ? Math.max(highestIndex, recipeIndex)
          : highestIndex;
      }, 0) + 1;
    const customRecipe: Recipe = {
      id: `custom-${nextCustomRecipeIndex}`,
      name: draftName.trim() || "나만의 레시피",
      origin: "나만의 레시피",
      method,
      profile: draftProfile.trim() || "직접 만든 추출 흐름",
      tags: ["나만의 레시피", method],
      dose: safeDose,
      water,
      ratio: formatRatio(safeDose, water),
      temp: draftTemp.trim() || "92C",
      grind: draftGrind.trim() || "중간 분쇄",
      totalTime,
      notes: [
        "브라우저에 저장되는 나만의 레시피",
        "단계별 시간과 목표 물량을 타이머에서 바로 따라갈 수 있습니다.",
      ],
      steps,
    };

    setCustomRecipes((currentRecipes) => [customRecipe, ...currentRecipes]);
    setSelectedId(customRecipe.id);
    syncTimerDose(customRecipe.dose);
    setFilter("나만의 레시피");
    clearBrewSessionClock();
    setTimerNotice(null);
    completionPlayedRef.current = false;
    previousElapsedRef.current = 0;
  }

  function deleteCustomRecipe(recipeId: string) {
    const activeClock = readBrewSessionClock();
    const deletingActiveRecipe = Boolean(
      activeClock?.sessionId &&
        activeClock.status !== "completed" &&
        activeClock.recipe?.id === recipeId,
    );

    if (deletingActiveRecipe) {
      setTimerNotice(
        "진행 중인 사용자 레시피는 타이머를 완료하거나 초기화한 뒤 삭제해 주세요.",
      );
      document.getElementById("brew-timer-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    setCustomRecipes((currentRecipes) =>
      currentRecipes.filter((recipe) => recipe.id !== recipeId),
    );
    setFavoriteIds((currentIds) => currentIds.filter((id) => id !== recipeId));

    if (selectedId === recipeId) {
      clearBrewSessionClock();
      setSelectedId(recipes[0].id);
      syncTimerDose(recipes[0].dose);
      setTimerNotice(null);
      completionPlayedRef.current = false;
      previousElapsedRef.current = 0;
    }
  }

  function resetTimer() {
    resetBrewSessionClock();
    setTimerNotice(null);
    completionPlayedRef.current = false;
    previousElapsedRef.current = 0;
  }

  function jumpToPreviousStep() {
    const previousStep = selectedRecipe.steps[currentStepIndex - 1];

    if (previousStep) {
      updateElapsed(previousStep.start);
      return;
    }

    updateElapsed(0);
  }

  function jumpToNextStep() {
    const nextStep = selectedRecipe.steps[currentStepIndex + 1];

    if (nextStep) {
      updateElapsed(nextStep.start);
      return;
    }

    updateElapsed(totalTime);
  }

  return (
    <main className="min-h-screen bg-[#f4f6f1] text-[#1d211c]">
      <header className="relative isolate overflow-hidden border-b border-black/10 bg-[#20251f] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageSrc}
          alt="핸드드립 커피 도구가 놓인 작업대"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/78 via-black/50 to-black/12" />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
          <section className="flex min-h-[300px] flex-col justify-between gap-8 py-2 sm:min-h-[360px]">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-white/72">
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Brew Desk
            </div>

            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold leading-[1.16] text-white sm:text-5xl">
                <span className="block sm:inline">핸드드립</span>{" "}
                <span className="block sm:ml-3 sm:inline">레시피 노트</span>
              </h1>
              <div className="mt-7 grid max-w-2xl grid-cols-3 gap-3 text-sm text-white/82">
                <div className="border-l border-white/35 pl-3">
                  <span className="block text-2xl font-semibold text-white">
                    {allRecipes.length}
                  </span>
                  레시피
                </div>
                <div className="border-l border-white/35 pl-3">
                  <span className="block text-2xl font-semibold text-white">
                    {formatTime(totalTime)}
                  </span>
                  선택 시간
                </div>
                <div className="border-l border-white/35 pl-3">
                  <span className="block text-2xl font-semibold text-white">
                    {selectedRecipe.ratio}
                  </span>
                  비율
                </div>
              </div>
            </div>
          </section>

          <section className="self-end rounded-lg border border-white/18 bg-white/92 p-4 text-[#1d211c] shadow-2xl shadow-black/25 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Now Brewing
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {selectedRecipe.name}
                </h2>
              </div>
              <div className="rounded-lg bg-[#e5eee4] px-3 py-2 text-right text-sm">
                <span className="block text-xs text-[#607064]">남은 시간</span>
                <strong className="font-mono text-xl">{formatTime(remaining)}</strong>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#d9ded6]">
              <div
                className="h-full rounded-full bg-[#2f6f5f]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-[#607064]">원두</span>
                <strong className="block text-lg">{dose}g</strong>
              </div>
              <div>
                <span className="text-[#607064]">
                  {selectedRecipe.finalWater ? "최종 물" : "물"}
                </span>
                <strong className="block text-lg">{scaledFinalWater}</strong>
              </div>
              <div>
                <span className="text-[#607064]">온도</span>
                <strong className="block text-lg">{recipeTemperaturePresentation(selectedRecipe).display}</strong>
              </div>
            </div>
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:px-8">
        <section className="order-2 min-w-0 space-y-5 lg:order-1">
          <div className="flex flex-col gap-3 rounded-lg border border-[#d7ded4] bg-white p-3 shadow-sm shadow-black/5">
            <label className="relative flex min-w-0 flex-1 items-center">
              <Search className="absolute left-3 h-4 w-4 text-[#607064]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="레시피 검색"
                placeholder="원두, 도구, 향미 검색"
                className="h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
              />
            </label>

            <div className="flex min-w-0 gap-1 overflow-x-auto rounded-md bg-[#edf1ea] p-1">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={filter === option}
                  className={`h-9 shrink-0 rounded-md px-3 text-sm font-medium transition ${
                    filter === option
                      ? "bg-[#2f6f5f] text-white shadow-sm"
                      : "text-[#48534b] hover:bg-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {storageNotice ? (
            <p
              role="alert"
              className="rounded-lg border border-[#dca18f] bg-[#fff0eb] px-4 py-3 text-sm text-[#8b3e2f]"
            >
              {storageNotice}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {filteredRecipes.map((recipe) => {
              const selected = recipe.id === selectedRecipe.id;
              const favorite = favoriteIds.includes(recipe.id);

              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => selectRecipe(recipe)}
                  aria-pressed={selected}
                  className={`min-w-0 rounded-lg border bg-white p-5 text-left shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-[#2f6f5f] hover:shadow-md ${
                    selected
                      ? "border-[#2f6f5f] ring-2 ring-[#2f6f5f]/18"
                      : "border-[#d7ded4]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#607064]">
                        {recipe.method}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">{recipe.name}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {favorite ? (
                        <Heart
                          className="h-4 w-4 fill-[#c95b3d] text-[#c95b3d]"
                          aria-label="즐겨찾기"
                        />
                      ) : null}
                      <span className="rounded-md bg-[#eef3ec] px-2.5 py-1 font-mono text-sm text-[#2f6f5f]">
                        {formatTime(recipe.totalTime)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#526055]">
                    {recipe.profile}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md bg-[#f4f6f1] p-3">
                      <Scale className="mb-2 h-4 w-4 text-[#2f6f5f]" aria-hidden="true" />
                      <span className="block text-[#607064]">원두</span>
                      <strong>{recipe.dose}g</strong>
                    </div>
                    <div className="rounded-md bg-[#f4f6f1] p-3">
                      <Droplets className="mb-2 h-4 w-4 text-[#2f6f5f]" aria-hidden="true" />
                      <span className="block text-[#607064]">물</span>
                      <strong>
                        {formatWaterAmount(recipe.finalWater ?? recipe.water)}
                      </strong>
                    </div>
                    <div className="rounded-md bg-[#f4f6f1] p-3">
                      <Thermometer className="mb-2 h-4 w-4 text-[#2f6f5f]" aria-hidden="true" />
                      <span className="block text-[#607064]">온도</span>
                      <strong>{recipeTemperaturePresentation(recipe).display}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-[#d7ded4] px-2.5 py-1 text-xs font-medium text-[#526055]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredRecipes.length === 0 ? (
            <p
              role="status"
              className="rounded-lg border border-dashed border-[#bfc9bd] bg-white px-5 py-8 text-center text-sm text-[#607064]"
            >
              검색 조건에 맞는 레시피가 없습니다.
            </p>
          ) : null}

          <section className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Custom Recipe
                </p>
                <h2 className="mt-2 text-xl font-semibold">나만의 레시피</h2>
              </div>
              <span className="rounded-md bg-[#eef3ec] px-3 py-1 text-sm font-semibold text-[#2f6f5f]">
                {customRecipes.length}개 저장됨
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">레시피 이름</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">드리퍼</span>
                <input
                  value={draftMethod}
                  onChange={(event) => setDraftMethod(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">원두량</span>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="8"
                    max="60"
                    value={draftDose}
                    onChange={(event) => setDraftDose(Number(event.target.value))}
                    className="h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                  />
                  <span className="text-sm font-semibold text-[#607064]">g</span>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">물 온도</span>
                <input
                  value={draftTemp}
                  onChange={(event) => setDraftTemp(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">분쇄도</span>
                <input
                  value={draftGrind}
                  onChange={(event) => setDraftGrind(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">맛 프로필</span>
                <input
                  value={draftProfile}
                  onChange={(event) => setDraftProfile(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
            </div>

            <div className="mt-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-[#1d211c]">추출 단계</h3>
                <span className="font-mono text-sm text-[#607064]">
                  {formatTime(draftTotalTime)} · {draftTotalWater}g ·{" "}
                  {formatRatio(clampNumber(draftDose, 8, 60), draftTotalWater)}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {draftSteps.map((step, index) => (
                  <div
                    key={`draft-step-${index}`}
                    className="grid gap-2 rounded-md border border-[#d7ded4] bg-[#f8faf6] p-3 lg:grid-cols-[minmax(110px,1fr)_92px_100px_minmax(150px,1.35fr)_40px]"
                  >
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">단계</span>
                      <input
                        value={step.label}
                        onChange={(event) =>
                          updateDraftStep(index, { label: event.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">시간</span>
                      <input
                        type="number"
                        min="5"
                        max="360"
                        value={step.duration}
                        onChange={(event) =>
                          updateDraftStep(index, {
                            duration: Number(event.target.value),
                          })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">목표 물</span>
                      <input
                        type="number"
                        min="0"
                        max="1200"
                        value={step.targetWater}
                        onChange={(event) =>
                          updateDraftStep(index, {
                            targetWater: Number(event.target.value),
                          })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">큐</span>
                      <input
                        value={step.cue}
                        onChange={(event) =>
                          updateDraftStep(index, { cue: event.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeDraftStep(index)}
                      disabled={draftSteps.length === 1}
                      aria-label={`${step.label} 삭제`}
                      className="flex h-10 w-10 items-center justify-center self-end rounded-md border border-[#d7ded4] text-[#607064] transition hover:border-[#c95b3d] hover:text-[#c95b3d] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={addDraftStep}
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#2f6f5f] transition hover:bg-[#eef5ef]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  단계 추가
                </button>
                <button
                  type="button"
                  onClick={saveCustomRecipe}
                  className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#2f6f5f] px-4 text-sm font-semibold text-white transition hover:bg-[#255c4f]"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  레시피 저장
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="flex h-10 items-center justify-center rounded-md border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#607064] transition hover:bg-[#f4f6f1]"
                >
                  초기화
                </button>
              </div>
            </div>

            {customRecipes.length > 0 ? (
              <div className="mt-5 border-t border-[#d7ded4] pt-4">
                <h3 className="text-sm font-semibold text-[#1d211c]">
                  저장된 레시피
                </h3>
                <div className="mt-3 space-y-2">
                  {customRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center gap-2 rounded-md bg-[#f8faf6] p-2"
                    >
                      <button
                        type="button"
                        onClick={() => selectRecipe(recipe)}
                        className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition hover:bg-white"
                      >
                        <strong className="block truncate text-sm">{recipe.name}</strong>
                        <span className="text-xs text-[#607064]">
                          {recipe.method} · {formatTime(recipe.totalTime)} ·{" "}
                          {recipe.water}g
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomRecipe(recipe.id)}
                        aria-label={`${recipe.name} 삭제`}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#d7ded4] text-[#607064] transition hover:border-[#c95b3d] hover:text-[#c95b3d]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </section>

        <aside className="order-1 min-w-0 space-y-4 lg:sticky lg:top-6 lg:order-2 lg:self-start">
          <section
            id="brew-timer-panel"
            className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Timer
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{currentStep.label}</h2>
              </div>
              <Timer className="h-6 w-6 text-[#2f6f5f]" aria-hidden="true" />
            </div>

            <div className="mt-6 rounded-lg bg-[#1f251f] p-5 text-white">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="text-sm text-white/62">경과</span>
                  <strong className="block font-mono text-5xl">
                    {formatTime(elapsed)}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white/62">목표</span>
                  <strong className="block font-mono text-2xl">
                    {formatTime(totalTime)}
                  </strong>
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/16">
                <div
                  className="h-full rounded-full bg-[#8bc9a4]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-[#1f251f] transition hover:bg-[#e5eee4]"
                >
                  {running ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                  {running ? "일시정지" : "시작"}
                </button>
                <button
                  type="button"
                  onClick={jumpToPreviousStep}
                  aria-label="이전 단계"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={jumpToNextStep}
                  aria-label="다음 단계"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
                >
                  <SkipForward className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  aria-label="초기화"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {timerNotice && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-3 rounded-md bg-[#fff3df] px-3 py-2 text-xs leading-5 text-[#805526]"
                >
                  {timerNotice}
                </p>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAlertsEnabled((current) => !current)}
                aria-pressed={alertsEnabled}
                className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition ${
                  alertsEnabled
                    ? "border-[#2f6f5f] bg-[#eef5ef] text-[#2f6f5f]"
                    : "border-[#d7ded4] bg-white text-[#607064]"
                }`}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                스마트 알림 {alertsEnabled ? "켜짐" : "꺼짐"}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(selectedRecipe.id)}
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
                    min="8"
                    max="40"
                    step="1"
                    value={doseInput}
                    data-timer-dose-input="true"
                    onChange={(event) => updateTimerDoseInput(event.target.value)}
                    onBlur={commitTimerDoseInput}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitTimerDoseInput();
                        event.currentTarget.blur();
                      }
                    }}
                    className="h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-lg font-semibold outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                  />
                  <span className="text-sm font-semibold text-[#607064]">g</span>
                </div>
              </label>
              {selectedRecipe.brewWater &&
              selectedRecipe.bypassWater !== undefined &&
              selectedRecipe.finalWater !== undefined ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                    <span className="text-sm text-[#607064]">추출수</span>
                    <strong className="mt-2 block text-lg">
                      {formatWaterAmount(selectedRecipe.brewWater, scaleFactor)}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                    <span className="text-sm text-[#607064]">후가수</span>
                    <strong className="mt-2 block text-lg">
                      {formatWaterAmount(selectedRecipe.bypassWater, scaleFactor)}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                    <span className="text-sm text-[#607064]">최종 물</span>
                    <strong className="mt-2 block text-lg">{scaledFinalWater}</strong>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                  <span className="text-sm text-[#607064]">총 물량</span>
                  <strong className="mt-2 block text-2xl">{scaledWater}g</strong>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm text-[#607064]">현재 물량</span>
                  <strong className="block text-3xl">{targetWater}</strong>
                </div>
                <div className="text-right">
                  <span className="text-sm text-[#607064]">이번 단계</span>
                  <strong className="block text-2xl">+{stepWater}</strong>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#d9ded6]">
                <div
                  className="h-full rounded-full bg-[#c95b3d]"
                  style={{ width: `${currentStepProgress * 100}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#526055]">{currentStep.cue}</p>
            </div>
          </section>

          <section className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Recipe
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {selectedRecipe.name}
                </h2>
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
              {selectedRecipe.steps.map((step, index) => ({ step, index })).filter(
                ({ step }) => step.end > step.start,
              ).map(({ step, index }) => {
                const active = index === currentStepIndex;
                const completed = elapsed >= step.end;

                return (
                  <button
                    key={`${selectedRecipe.id}-${index}-${step.label}`}
                    type="button"
                    onClick={() => updateElapsed(step.start)}
                    className={`grid w-full grid-cols-[58px_1fr_62px] items-center gap-3 rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-[#2f6f5f] bg-[#eef5ef]"
                        : completed
                          ? "border-[#d7ded4] bg-[#f8faf6] text-[#607064]"
                          : "border-[#d7ded4] bg-white"
                    }`}
                  >
                    <span className="font-mono text-sm">
                      {formatTime(step.start)}
                    </span>
                    <span>
                      <strong className="block text-sm">{step.label}</strong>
                      <span className="text-xs text-[#607064]">
                        {formatTime(step.end - step.start)}
                      </span>
                    </span>
                    <span className="text-right font-semibold">
                      {formatWaterAmount(
                        step.displayTargetWater ?? step.targetWater,
                        scaleFactor,
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
      </div>
    </main>
  );
}
