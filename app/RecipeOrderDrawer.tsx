"use client";

import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ListOrdered,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { defaultRecipes } from "@/data/defaultRecipes";
import { useRecipeOrder } from "@/lib/recipes/useRecipeOrder";

const longPressDelayMs = 220;

export default function RecipeOrderDrawer() {
  const [open, setOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastTargetIdRef = useRef<string | null>(null);
  const { recipes, orderIds, moveRecipe, moveRecipeToTarget, resetOrder } =
    useRecipeOrder();

  const defaultIds = useMemo(
    () => new Set(defaultRecipes.map((recipe) => recipe.id)),
    [],
  );
  const recipeById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes],
  );

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  function startLongPress(
    event: ReactPointerEvent<HTMLButtonElement>,
    recipeId: string,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    clearLongPressTimer();
    pointerIdRef.current = event.pointerId;
    lastTargetIdRef.current = recipeId;
    const handle = event.currentTarget;

    longPressTimerRef.current = window.setTimeout(() => {
      dragIdRef.current = recipeId;
      setDraggingId(recipeId);
      setDragOverId(recipeId);
      handle.setPointerCapture?.(event.pointerId);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(20);
      }
    }, longPressDelayMs);
  }

  function dragPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const activeId = dragIdRef.current;

    if (!activeId || pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const hoveredItem = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-recipe-order-item="true"]');
    const targetId = hoveredItem?.dataset.recipeOrderId ?? null;

    if (
      !targetId ||
      targetId === activeId ||
      targetId === lastTargetIdRef.current
    ) {
      return;
    }

    lastTargetIdRef.current = targetId;
    setDragOverId(targetId);
    moveRecipeToTarget(activeId, targetId);
  }

  function finishDrag(event?: ReactPointerEvent<HTMLButtonElement>) {
    clearLongPressTimer();

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

  function closeDrawer() {
    finishDrag();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        data-mobile-coffee-target="recipe-order"
        onClick={() => setOpen(true)}
        className="fixed bottom-[25rem] right-4 z-40 hidden rounded-full border border-[#d7ded4] bg-white px-4 py-3 text-sm font-semibold text-[#2f6f5f] shadow-lg shadow-black/12 transition hover:-translate-y-0.5 hover:bg-[#f4f6f1] lg:flex lg:items-center lg:gap-2"
      >
        <ListOrdered className="h-4 w-4" aria-hidden="true" />
        레시피 순서
      </button>

      <button
        type="button"
        data-mobile-coffee-target="recipe-order"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex rounded-full border border-[#d7ded4] bg-white px-4 py-3 text-sm font-semibold text-[#2f6f5f] shadow-lg shadow-black/12 transition hover:bg-[#f4f6f1] lg:hidden"
      >
        <ListOrdered className="mr-2 h-4 w-4" aria-hidden="true" />
        레시피 순서
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/36">
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="레시피 표시 순서 편집"
            className="ml-auto flex h-full w-full max-w-md flex-col bg-[#f8faf6] shadow-2xl shadow-black/30"
          >
            <header className="border-b border-[#d7ded4] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#607064]">
                    Recipe Order
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[#1d211c]">
                    레시피 리스트 순서
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#607064]">
                    왼쪽 손잡이를 길게 누른 뒤 위·아래로 드래그하세요. 변경 즉시 React 상태와 브라우저에 저장됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="레시피 순서 편집 닫기"
                  className="rounded-md border border-[#d7ded4] bg-white p-2 text-[#607064] transition hover:bg-[#f4f6f1]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {orderIds.length > 0 ? (
                <ol className="space-y-2">
                  {orderIds.map((recipeId, index) => {
                    const recipe = recipeById.get(recipeId);
                    if (!recipe) {
                      return null;
                    }

                    const dragging = draggingId === recipeId;
                    const dragOver = dragOverId === recipeId && !dragging;

                    return (
                      <li
                        key={recipeId}
                        data-recipe-order-item="true"
                        data-recipe-order-id={recipeId}
                        className={`rounded-lg border bg-white p-3 shadow-sm transition ${
                          dragging
                            ? "scale-[1.02] border-[#2f6f5f] opacity-80 shadow-lg"
                            : dragOver
                              ? "border-[#2f6f5f] ring-2 ring-[#2f6f5f]/20"
                              : "border-[#d7ded4]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onPointerDown={(event) => startLongPress(event, recipeId)}
                            onPointerMove={dragPointerMove}
                            onPointerUp={finishDrag}
                            onPointerCancel={finishDrag}
                            onContextMenu={(event) => event.preventDefault()}
                            aria-label={`${recipe.name} 길게 눌러 순서 이동`}
                            title="길게 눌러 드래그"
                            className={`flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-md border transition active:cursor-grabbing ${
                              dragging
                                ? "border-[#2f6f5f] bg-[#e6f0ea] text-[#2f6f5f]"
                                : "border-[#d7ded4] bg-[#f8faf6] text-[#607064] hover:bg-[#eef5ef]"
                            }`}
                            style={{ touchAction: "none" }}
                          >
                            <GripVertical className="h-5 w-5" aria-hidden="true" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1d211c]">
                              {index + 1}. {recipe.name}
                            </p>
                            <p className="mt-1 text-xs text-[#607064]">
                              {dragging
                                ? "이동 중 — 원하는 위치에서 놓으세요"
                                : defaultIds.has(recipeId)
                                  ? "기본 레시피"
                                  : "추천/나만의 레시피"}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveRecipe(recipeId, -1)}
                              disabled={index === 0 || Boolean(draggingId)}
                              aria-label={`${recipe.name} 위로 이동`}
                              className="rounded-md border border-[#d7ded4] p-2 text-[#607064] transition hover:bg-[#eef5ef] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowUp className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRecipe(recipeId, 1)}
                              disabled={index === orderIds.length - 1 || Boolean(draggingId)}
                              aria-label={`${recipe.name} 아래로 이동`}
                              className="rounded-md border border-[#d7ded4] p-2 text-[#607064] transition hover:bg-[#eef5ef] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowDown className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="rounded-lg border border-dashed border-[#bfc9bd] bg-white px-4 py-8 text-center text-sm text-[#607064]">
                  표시 중인 레시피 목록을 찾지 못했습니다.
                </p>
              )}
            </div>

            <footer className="border-t border-[#d7ded4] bg-white p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetOrder}
                  disabled={Boolean(draggingId)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#607064] transition hover:bg-[#f4f6f1] disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  기본 순서
                </button>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="h-11 flex-1 rounded-md bg-[#2f6f5f] px-4 text-sm font-semibold text-white transition hover:bg-[#255c4f]"
                >
                  완료
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
