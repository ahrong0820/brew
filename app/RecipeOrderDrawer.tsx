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
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { defaultRecipes } from "@/data/defaultRecipes";

const recipeOrderStorageKey = "brew.recipeDisplayOrder.v1";
const recipeOrderUpdatedEvent = "brew:recipe-display-order-updated";
const orderSeparator = "|||";
const longPressDelayMs = 220;

function readStoredRecipeOrder() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(recipeOrderStorageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStoredRecipeOrder(order: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(recipeOrderStorageKey, JSON.stringify(order));
    window.dispatchEvent(new CustomEvent(recipeOrderUpdatedEvent));
  } catch {
    // Keep the in-memory order usable even when browser storage is unavailable.
  }
}

function getMainContentSection() {
  const mainGrid = document.querySelector("main > header + div");

  if (!mainGrid) {
    return null;
  }

  return (
    (Array.from(mainGrid.children).find(
      (element) => element.tagName === "SECTION",
    ) as HTMLElement | undefined) ?? null
  );
}

function markRecipeListFromLayout() {
  const contentSection = getMainContentSection();

  if (!contentSection) {
    return null;
  }

  const candidateLists = Array.from(contentSection.children).filter(
    (element) => element.tagName === "DIV",
  ) as HTMLElement[];
  const recipeList =
    candidateLists.find((element) =>
      Array.from(element.children).some(
        (child) =>
          child instanceof HTMLButtonElement &&
          Boolean(child.querySelector("h3")),
      ),
    ) ?? null;

  if (!recipeList) {
    return null;
  }

  recipeList.dataset.recipeList = "true";
  Array.from(recipeList.children).forEach((element) => {
    if (
      element instanceof HTMLButtonElement &&
      element.querySelector("h3")
    ) {
      element.dataset.recipeRow = "true";
    }
  });

  return recipeList;
}

function getRecipeList() {
  return (
    (document.querySelector('[data-recipe-list="true"]') as HTMLElement | null) ??
    markRecipeListFromLayout()
  );
}

function getRecipeRows() {
  const recipeList = getRecipeList();

  if (!recipeList) {
    return [];
  }

  return Array.from(recipeList.children).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      element.dataset.recipeRow === "true" &&
      Boolean(element.querySelector("h3")),
  );
}

function getRecipeRowName(row: HTMLElement) {
  return row.querySelector("h3")?.textContent?.trim() ?? "";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function orderVisibleNames(visibleNames: string[], storedOrder: string[]) {
  const uniqueVisibleNames = unique(visibleNames);
  const visibleNameSet = new Set(uniqueVisibleNames);
  const orderedStoredNames = unique(storedOrder).filter((name) =>
    visibleNameSet.has(name),
  );
  const newNames = uniqueVisibleNames.filter(
    (name) => !orderedStoredNames.includes(name),
  );

  return [...orderedStoredNames, ...newNames];
}

function getDefaultResetOrder(visibleNames: string[]) {
  const defaultNames = defaultRecipes.map((recipe) => recipe.name);
  const defaultNameSet = new Set(defaultNames);
  const extras = visibleNames.filter((name) => !defaultNameSet.has(name));
  const visibleNameSet = new Set(visibleNames);
  const visibleDefaults = defaultNames.filter((name) => visibleNameSet.has(name));

  return unique([...extras, ...visibleDefaults]);
}

function moveName(order: string[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction;

  if (targetIndex < 0 || targetIndex >= order.length) {
    return order;
  }

  const nextOrder = [...order];
  const current = nextOrder[index];
  nextOrder[index] = nextOrder[targetIndex];
  nextOrder[targetIndex] = current;
  return nextOrder;
}

function moveNameToTarget(order: string[], draggedName: string, targetName: string) {
  const fromIndex = order.indexOf(draggedName);
  const targetIndex = order.indexOf(targetName);

  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) {
    return order;
  }

  const nextOrder = [...order];
  nextOrder.splice(fromIndex, 1);
  nextOrder.splice(targetIndex, 0, draggedName);
  return nextOrder;
}

function applyRecipeOrderToDom() {
  const recipeList = getRecipeList();
  const rows = getRecipeRows();

  if (!recipeList || rows.length === 0) {
    return [];
  }

  const visibleNames = rows.map(getRecipeRowName).filter(Boolean);
  const nextNames = orderVisibleNames(visibleNames, readStoredRecipeOrder());
  const rowsByName = new Map(rows.map((row) => [getRecipeRowName(row), row]));
  const currentNames = rows.map(getRecipeRowName).filter(Boolean);

  if (currentNames.join(orderSeparator) !== nextNames.join(orderSeparator)) {
    for (const name of nextNames) {
      const row = rowsByName.get(name);

      if (row) {
        recipeList.appendChild(row);
      }
    }
  }

  getRecipeRows().forEach((element, index) => {
    element.dataset.recipeOrderIndex = String(index + 1);
  });

  return nextNames;
}

export default function RecipeOrderDrawer() {
  const [open, setOpen] = useState(false);
  const [recipeNames, setRecipeNames] = useState<string[]>([]);
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const [dragOverName, setDragOverName] = useState<string | null>(null);
  const defaultNames = useMemo(() => defaultRecipes.map((recipe) => recipe.name), []);
  const longPressTimerRef = useRef<number | null>(null);
  const dragNameRef = useRef<string | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastTargetNameRef = useRef<string | null>(null);

  const syncRecipeOrder = useCallback(() => {
    setRecipeNames(applyRecipeOrderToDom());
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let frameId = 0;

    function scheduleSync() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncRecipeOrder);
    }

    scheduleSync();
    window.addEventListener(recipeOrderUpdatedEvent, scheduleSync);

    const observerTarget = document.querySelector("main");
    const observer = new MutationObserver(scheduleSync);

    if (observerTarget) {
      observer.observe(observerTarget, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearLongPressTimer();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(recipeOrderUpdatedEvent, scheduleSync);
      observer.disconnect();
    };
  }, [clearLongPressTimer, syncRecipeOrder]);

  function persistOrder(nextOrder: string[]) {
    setRecipeNames(nextOrder);
    writeStoredRecipeOrder(nextOrder);
    window.requestAnimationFrame(syncRecipeOrder);
  }

  function moveRecipe(index: number, direction: -1 | 1) {
    const nextOrder = moveName(recipeNames, index, direction);
    persistOrder(nextOrder);
  }

  function resetOrder() {
    const visibleNames = getRecipeRows().map(getRecipeRowName).filter(Boolean);
    const resetOrderNames = getDefaultResetOrder(visibleNames);
    persistOrder(resetOrderNames);
  }

  function startLongPress(
    event: ReactPointerEvent<HTMLButtonElement>,
    recipeName: string,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    clearLongPressTimer();
    pointerIdRef.current = event.pointerId;
    lastTargetNameRef.current = recipeName;
    const handle = event.currentTarget;

    longPressTimerRef.current = window.setTimeout(() => {
      dragNameRef.current = recipeName;
      setDraggingName(recipeName);
      setDragOverName(recipeName);
      handle.setPointerCapture?.(event.pointerId);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(20);
      }
    }, longPressDelayMs);
  }

  function dragPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const activeName = dragNameRef.current;

    if (!activeName || pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const hoveredItem = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-recipe-order-item="true"]');
    const targetName = hoveredItem?.dataset.recipeOrderName ?? null;

    if (
      !targetName ||
      targetName === activeName ||
      targetName === lastTargetNameRef.current
    ) {
      return;
    }

    lastTargetNameRef.current = targetName;
    setDragOverName(targetName);
    setRecipeNames((currentOrder) => {
      const nextOrder = moveNameToTarget(currentOrder, activeName, targetName);
      writeStoredRecipeOrder(nextOrder);
      window.requestAnimationFrame(syncRecipeOrder);
      return nextOrder;
    });
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

    dragNameRef.current = null;
    pointerIdRef.current = null;
    lastTargetNameRef.current = null;
    setDraggingName(null);
    setDragOverName(null);
  }

  function openDrawer() {
    syncRecipeOrder();
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        data-mobile-coffee-target="recipe-order"
        onClick={openDrawer}
        className="fixed bottom-[25rem] right-4 z-40 hidden rounded-full border border-[#d7ded4] bg-white px-4 py-3 text-sm font-semibold text-[#2f6f5f] shadow-lg shadow-black/12 transition hover:-translate-y-0.5 hover:bg-[#f4f6f1] lg:flex lg:items-center lg:gap-2"
      >
        <ListOrdered className="h-4 w-4" aria-hidden="true" />
        레시피 순서
      </button>

      <button
        type="button"
        data-mobile-coffee-target="recipe-order"
        onClick={openDrawer}
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
                    왼쪽 손잡이를 길게 누른 뒤 위·아래로 드래그하세요. 놓는 즉시 순서가 저장됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    finishDrag();
                    setOpen(false);
                  }}
                  aria-label="레시피 순서 편집 닫기"
                  className="rounded-md border border-[#d7ded4] bg-white p-2 text-[#607064] transition hover:bg-[#f4f6f1]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {recipeNames.length > 0 ? (
                <ol className="space-y-2">
                  {recipeNames.map((recipeName, index) => {
                    const isDefaultRecipe = defaultNames.includes(recipeName);
                    const dragging = draggingName === recipeName;
                    const dragOver = dragOverName === recipeName && !dragging;

                    return (
                      <li
                        key={recipeName}
                        data-recipe-order-item="true"
                        data-recipe-order-name={recipeName}
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
                            onPointerDown={(event) => startLongPress(event, recipeName)}
                            onPointerMove={dragPointerMove}
                            onPointerUp={finishDrag}
                            onPointerCancel={finishDrag}
                            onContextMenu={(event) => event.preventDefault()}
                            aria-label={`${recipeName} 길게 눌러 순서 이동`}
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
                              {index + 1}. {recipeName}
                            </p>
                            <p className="mt-1 text-xs text-[#607064]">
                              {dragging
                                ? "이동 중 — 원하는 위치에서 놓으세요"
                                : isDefaultRecipe
                                  ? "기본 레시피"
                                  : "추천/나만의 레시피"}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveRecipe(index, -1)}
                              disabled={index === 0 || Boolean(draggingName)}
                              aria-label={`${recipeName} 위로 이동`}
                              className="rounded-md border border-[#d7ded4] p-2 text-[#607064] transition hover:bg-[#eef5ef] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowUp className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRecipe(index, 1)}
                              disabled={
                                index === recipeNames.length - 1 || Boolean(draggingName)
                              }
                              aria-label={`${recipeName} 아래로 이동`}
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
                  disabled={Boolean(draggingName)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#607064] transition hover:bg-[#f4f6f1] disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  기본 순서
                </button>
                <button
                  type="button"
                  onClick={() => {
                    finishDrag();
                    setOpen(false);
                  }}
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
