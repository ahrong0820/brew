"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

import { formatRecipeTime } from "@/lib/recipes/recipePresentation";
import { readBrewSessionClock } from "@/lib/timer/brewSessionClock";
import type { Recipe } from "@/lib/types/defaultRecipe";

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

function createDefaultDraftSteps() {
  return defaultDraftSteps.map((step) => ({ ...step }));
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
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

type CustomRecipeEditorProps = {
  customRecipes: readonly Recipe[];
  setCustomRecipes: Dispatch<SetStateAction<Recipe[]>>;
  selectedRecipeId: string;
  defaultRecipe: Recipe;
  onSelectRecipe: (recipe: Recipe) => void;
  onRemoveFavorite: (recipeId: string) => void;
  onFilterChange: (filter: string) => void;
  onBlocked: (message: string) => void;
};

export default function CustomRecipeEditor({
  customRecipes,
  setCustomRecipes,
  selectedRecipeId,
  defaultRecipe,
  onSelectRecipe,
  onRemoveFavorite,
  onFilterChange,
  onBlocked,
}: CustomRecipeEditorProps) {
  const [customEditorOpen, setCustomEditorOpen] = useState(false);
  const [draftName, setDraftName] = useState("오전용 V60 레시피");
  const [draftMethod, setDraftMethod] = useState("V60");
  const [draftProfile, setDraftProfile] = useState("직접 만든 추출 흐름");
  const [draftDose, setDraftDose] = useState(20);
  const [draftTemp, setDraftTemp] = useState("92C");
  const [draftGrind, setDraftGrind] = useState("중간 분쇄");
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>(createDefaultDraftSteps);

  const lastDraftStep = draftSteps[draftSteps.length - 1];
  const draftTotalWater = lastDraftStep?.targetWater ?? 0;
  const draftTotalTime = draftSteps.reduce(
    (total, step) => total + clampNumber(step.duration, 5, 360),
    0,
  );

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
      onBlocked("진행 중인 추천 추출을 완료한 뒤 나만의 레시피를 저장해 주세요.");
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
    onSelectRecipe(customRecipe);
    onFilterChange("나만의 레시피");
    setCustomEditorOpen(false);
  }

  function deleteCustomRecipe(recipeId: string) {
    const activeClock = readBrewSessionClock();
    const deletingActiveRecipe = Boolean(
      activeClock?.sessionId &&
        activeClock.status !== "completed" &&
        activeClock.recipe?.id === recipeId,
    );

    if (deletingActiveRecipe) {
      onBlocked(
        "진행 중인 사용자 레시피는 타이머를 완료하거나 초기화한 뒤 삭제해 주세요.",
      );
      return;
    }

    setCustomRecipes((currentRecipes) =>
      currentRecipes.filter((recipe) => recipe.id !== recipeId),
    );
    onRemoveFavorite(recipeId);

    if (selectedRecipeId === recipeId) {
      onSelectRecipe(defaultRecipe);
    }
  }

  return (
    <section
      data-custom-editor-open={String(customEditorOpen)}
      className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[#607064]">Custom Recipe</p>
          <h2 className="mt-2 text-xl font-semibold">나만의 레시피</h2>
        </div>
        <span className="rounded-md bg-[#eef3ec] px-3 py-1 text-sm font-semibold text-[#2f6f5f]">
          {customRecipes.length}개 저장됨
        </span>
      </div>

      <button
        type="button"
        data-custom-editor-toggle="true"
        aria-expanded={customEditorOpen}
        onClick={() => setCustomEditorOpen((current) => !current)}
        className="mobile-custom-toggle"
      >
        {customEditorOpen ? "편집기 닫기" : "＋ 나만의 레시피 만들기"}
      </button>

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
            {formatRecipeTime(draftTotalTime)} · {draftTotalWater}g ·{" "}
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
                  onChange={(event) => updateDraftStep(index, { label: event.target.value })}
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
                    updateDraftStep(index, { duration: Number(event.target.value) })
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
                    updateDraftStep(index, { targetWater: Number(event.target.value) })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#607064]">큐</span>
                <input
                  value={step.cue}
                  onChange={(event) => updateDraftStep(index, { cue: event.target.value })}
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
          <h3 className="text-sm font-semibold text-[#1d211c]">저장된 레시피</h3>
          <div className="mt-3 space-y-2">
            {customRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center gap-2 rounded-md bg-[#f8faf6] p-2"
              >
                <button
                  type="button"
                  onClick={() => onSelectRecipe(recipe)}
                  className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition hover:bg-white"
                >
                  <strong className="block truncate text-sm">{recipe.name}</strong>
                  <span className="text-xs text-[#607064]">
                    {recipe.method} · {formatRecipeTime(recipe.totalTime)} · {recipe.water}g
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
  );
}
