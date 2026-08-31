"use client";

import {
  Droplets,
  GripVertical,
  Heart,
  Scale,
  Search,
  Thermometer,
} from "lucide-react";
import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { getAdjacentRecipeId } from "@/lib/recipes/recipeOrderNavigation";
import { recipeTemperaturePresentation } from "@/lib/recipes/recipeTemperature";
import {
  formatRecipeTime,
  formatRecipeWaterAmount,
} from "@/lib/recipes/recipePresentation";
import type { Recipe } from "@/lib/types/defaultRecipe";

export const recipeFilterOptions = [
  "전체",
  "즐겨찾기",
  "나만의 레시피",
  "V60",
  "클레버",
  "스위치",
  "라이트",
  "단맛",
] as const;

type RecipeCatalogProps = {
  query: string;
  filter: string;
  recipes: readonly Recipe[];
  selectedRecipeId: string;
  favoriteIds: readonly string[];
  storageNotice: string | null;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onMoveRecipe: (recipeId: string, targetId: string) => void;
};

export default function RecipeCatalog({
  query,
  filter,
  recipes,
  selectedRecipeId,
  favoriteIds,
  storageNotice,
  onQueryChange,
  onFilterChange,
  onSelectRecipe,
  onMoveRecipe,
}: RecipeCatalogProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastTargetIdRef = useRef<string | null>(null);

  function startDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    recipeId: string,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragIdRef.current = recipeId;
    pointerIdRef.current = event.pointerId;
    lastTargetIdRef.current = recipeId;
    setDraggingId(recipeId);
    setDragOverId(recipeId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function dragPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const activeId = dragIdRef.current;

    if (!activeId || pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const hoveredRow = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-recipe-row="true"]');
    const targetId = hoveredRow?.dataset.recipeId ?? null;

    if (
      !targetId ||
      targetId === activeId ||
      targetId === lastTargetIdRef.current
    ) {
      return;
    }

    lastTargetIdRef.current = targetId;
    setDragOverId(targetId);
    onMoveRecipe(activeId, targetId);
  }

  function finishDrag(event?: ReactPointerEvent<HTMLButtonElement>) {
    if (
      event &&
      pointerIdRef.current === event.pointerId &&
      event.currentTarget.hasPointerCapture?.(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    dragIdRef.current = null;
    pointerIdRef.current = null;
    lastTargetIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  }

  function moveWithKeyboard(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    recipeId: string,
  ) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    const direction = event.key === "ArrowUp" ? -1 : 1;
    const targetId = getAdjacentRecipeId(
      recipes.map((recipe) => recipe.id),
      recipeId,
      direction,
    );

    if (!targetId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onMoveRecipe(recipeId, targetId);
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-[#d7ded4] bg-white p-3 shadow-sm shadow-black/5">
        <label className="relative flex min-w-0 flex-1 items-center">
          <Search
            className="absolute left-3 h-4 w-4 text-[#607064]"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="레시피 검색"
            placeholder="원두, 도구, 향미 검색"
            className="h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
          />
        </label>

        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-md bg-[#edf1ea] p-1">
          {recipeFilterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
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

        <p id="recipe-catalog-drag-hint" className="sr-only">
          카드 오른쪽 위 손잡이를 드래그하거나 방향키를 눌러 표시 순서를 바꿀 수 있습니다.
        </p>
      </div>

      {storageNotice ? (
        <p
          role="alert"
          className="rounded-lg border border-[#dca18f] bg-[#fff0eb] px-4 py-3 text-sm text-[#8b3e2f]"
        >
          {storageNotice}
        </p>
      ) : null}

      <div data-recipe-list="true" className="grid gap-4 md:grid-cols-2">
        {recipes.map((recipe) => {
          const selected = recipe.id === selectedRecipeId;
          const favorite = favoriteIds.includes(recipe.id);
          const dragging = draggingId === recipe.id;
          const dragOver = dragOverId === recipe.id && !dragging;

          return (
            <div
              key={recipe.id}
              data-recipe-row="true"
              data-recipe-id={recipe.id}
              data-recipe-selected={selected ? "true" : "false"}
              className={`group relative min-w-0 rounded-lg border bg-white shadow-sm shadow-black/5 transition ${
                dragging
                  ? "scale-[1.01] border-[#2f6f5f] opacity-75 shadow-lg"
                  : dragOver
                    ? "border-[#2f6f5f] ring-2 ring-[#2f6f5f]/20"
                    : selected
                      ? "border-[#2f6f5f] ring-2 ring-[#2f6f5f]/18"
                      : "border-[#d7ded4] hover:-translate-y-0.5 hover:border-[#2f6f5f] hover:shadow-md"
              }`}
            >
              <button
                type="button"
                data-recipe-select="true"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelectRecipe(recipe)}
                aria-pressed={selected}
                className="block w-full rounded-lg p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#2f6f5f]/35"
              >
                <div
                  data-recipe-header="true"
                  className="flex items-start justify-between gap-3 pr-10"
                >
                  <div data-recipe-heading="true" className="min-w-0">
                    <p
                      data-recipe-method="true"
                      className="text-xs font-semibold uppercase text-[#607064]"
                    >
                      {recipe.method}
                    </p>
                    <h3
                      data-recipe-name="true"
                      className="mt-1.5 text-lg font-semibold leading-6"
                    >
                      {recipe.name}
                    </h3>
                  </div>
                  <div
                    data-recipe-meta="true"
                    className="flex shrink-0 items-center gap-1.5"
                  >
                    {favorite ? (
                      <Heart
                        className="h-4 w-4 fill-[#c95b3d] text-[#c95b3d]"
                        aria-label="즐겨찾기"
                      />
                    ) : null}
                    <span className="rounded-md bg-[#eef3ec] px-2 py-0.5 font-mono text-xs text-[#2f6f5f]">
                      {formatRecipeTime(recipe.totalTime)}
                    </span>
                  </div>
                </div>

                <p
                  data-recipe-profile="true"
                  className="mt-2 text-sm leading-5 text-[#526055]"
                >
                  {recipe.profile}
                </p>

                <div
                  data-recipe-metrics="true"
                  className="mt-4 grid grid-cols-3 gap-2 text-sm"
                >
                  <div className="rounded-md bg-[#f4f6f1] p-2.5">
                    <Scale
                      className="mb-1 h-4 w-4 text-[#2f6f5f]"
                      aria-hidden="true"
                    />
                    <span className="block text-xs text-[#607064]">원두</span>
                    <strong>{recipe.dose}g</strong>
                  </div>
                  <div className="rounded-md bg-[#f4f6f1] p-2.5">
                    <Droplets
                      className="mb-1 h-4 w-4 text-[#2f6f5f]"
                      aria-hidden="true"
                    />
                    <span className="block text-xs text-[#607064]">물</span>
                    <strong>
                      {formatRecipeWaterAmount(recipe.finalWater ?? recipe.water)}
                    </strong>
                  </div>
                  <div className="rounded-md bg-[#f4f6f1] p-2.5">
                    <Thermometer
                      className="mb-1 h-4 w-4 text-[#2f6f5f]"
                      aria-hidden="true"
                    />
                    <span className="block text-xs text-[#607064]">온도</span>
                    <strong>{recipeTemperaturePresentation(recipe).display}</strong>
                  </div>
                </div>

                <div
                  data-recipe-tags="true"
                  className="mt-3 flex flex-wrap gap-1.5"
                >
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-[#d7ded4] px-2 py-0.5 text-xs font-medium text-[#526055]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>

              <button
                type="button"
                data-recipe-drag-handle="true"
                onPointerDown={(event) => startDrag(event, recipe.id)}
                onPointerMove={dragPointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onKeyDown={(event) => moveWithKeyboard(event, recipe.id)}
                onContextMenu={(event) => event.preventDefault()}
                disabled={recipes.length < 2}
                aria-label={`${recipe.name} 순서 드래그`}
                aria-describedby="recipe-catalog-drag-hint"
                title="드래그하거나 방향키로 순서 이동"
                className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  dragging
                    ? "cursor-grabbing border-[#2f6f5f] bg-[#e6f0ea] text-[#2f6f5f]"
                    : "cursor-grab border-[#d7ded4] bg-white/95 text-[#607064] hover:bg-[#eef5ef] active:cursor-grabbing"
                }`}
                style={{ touchAction: "none" }}
              >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {recipes.length === 0 ? (
        <p
          role="status"
          className="rounded-lg border border-dashed border-[#bfc9bd] bg-white px-5 py-8 text-center text-sm text-[#607064]"
        >
          검색 조건에 맞는 레시피가 없습니다.
        </p>
      ) : null}
    </>
  );
}
