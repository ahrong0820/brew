"use client";

import { ArrowDown, ArrowUp, ListOrdered, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { defaultRecipes } from "@/data/defaultRecipes";

const recipeOrderStorageKey = "brew.recipeDisplayOrder.v1";
const recipeOrderUpdatedEvent = "brew:recipe-display-order-updated";
const orderSeparator = "|||";

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

  window.localStorage.setItem(recipeOrderStorageKey, JSON.stringify(order));
  window.dispatchEvent(new CustomEvent(recipeOrderUpdatedEvent));
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

  const directDivs = Array.from(contentSection.children).filter(
    (element) => element.tagName === "DIV",
  ) as HTMLElement[];
  const recipeList =
    directDivs.find((element) =>
      Array.from(element.children).some(
        (child) => child instanceof HTMLElement && child.querySelector("h3"),
      ),
    ) ?? null;

  if (!recipeList) {
    return null;
  }

  recipeList.dataset.recipeList = "true";
  Array.from(recipeList.children).forEach((element) => {
    if (element instanceof HTMLElement && element.tagName === "BUTTON") {
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

  return Array.from(
    recipeList.querySelectorAll<HTMLElement>(':scope > [data-recipe-row="true"]'),
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

function ensureInlineOrderControl() {
  const contentSection = getMainContentSection();

  if (!contentSection) {
    return;
  }

  const existingControl = contentSection.querySelector(
    '[data-recipe-order-inline-control="true"]',
  );

  if (existingControl) {
    return;
  }

  const firstBlock = Array.from(contentSection.children).find(
    (element) => element.tagName === "DIV",
  );

  if (!(firstBlock instanceof HTMLElement)) {
    return;
  }

  const control = document.createElement("div");
  control.dataset.recipeOrderInlineControl = "true";
  control.className =
    "flex flex-col gap-2 rounded-lg border border-[#d7ded4] bg-white p-3 shadow-sm shadow-black/5 sm:flex-row sm:items-center sm:justify-between";

  const copy = document.createElement("p");
  copy.className = "text-sm leading-6 text-[#607064]";
  copy.textContent = "리버스 스위치를 첫 번째, 네오브루를 두 번째처럼 레시피 표시 순서를 바꿀 수 있습니다.";

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.recipeOrderInlineToggle = "true";
  button.className =
    "flex h-10 shrink-0 items-center justify-center rounded-md bg-[#2f6f5f] px-4 text-sm font-semibold text-white transition hover:bg-[#255c4f]";
  button.textContent = "레시피 순서 편집";

  control.append(copy, button);
  firstBlock.insertAdjacentElement("afterend", control);
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

  Array.from(recipeList.children).forEach((element, index) => {
    if (element instanceof HTMLElement && element.dataset.recipeRow === "true") {
      element.dataset.recipeOrderIndex = String(index + 1);
    }
  });

  return nextNames;
}

export default function RecipeOrderDrawer() {
  const [open, setOpen] = useState(false);
  const [recipeNames, setRecipeNames] = useState<string[]>([]);
  const defaultNames = useMemo(() => defaultRecipes.map((recipe) => recipe.name), []);

  const syncRecipeOrder = useCallback(() => {
    ensureInlineOrderControl();
    setRecipeNames(applyRecipeOrderToDom());
  }, []);

  useEffect(() => {
    let frameId = 0;

    function scheduleSync() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncRecipeOrder);
    }

    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const inlineToggle = event.target.closest(
        '[data-recipe-order-inline-toggle="true"]',
      );

      if (inlineToggle) {
        event.preventDefault();
        syncRecipeOrder();
        setOpen(true);
      }
    }

    scheduleSync();
    window.addEventListener(recipeOrderUpdatedEvent, scheduleSync);
    document.addEventListener("click", handleClick);

    const observerTarget = document.querySelector("main");
    const observer = new MutationObserver(scheduleSync);

    if (observerTarget) {
      observer.observe(observerTarget, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(recipeOrderUpdatedEvent, scheduleSync);
      document.removeEventListener("click", handleClick);
      observer.disconnect();
      document
        .querySelectorAll('[data-recipe-order-inline-control="true"]')
        .forEach((element) => element.remove());
    };
  }, [syncRecipeOrder]);

  function moveRecipe(index: number, direction: -1 | 1) {
    const nextOrder = moveName(recipeNames, index, direction);
    setRecipeNames(nextOrder);
    writeStoredRecipeOrder(nextOrder);
    window.requestAnimationFrame(syncRecipeOrder);
  }

  function resetOrder() {
    const visibleNames = getRecipeRows().map(getRecipeRowName).filter(Boolean);
    const resetOrderNames = getDefaultResetOrder(visibleNames);
    setRecipeNames(resetOrderNames);
    writeStoredRecipeOrder(resetOrderNames);
    window.requestAnimationFrame(syncRecipeOrder);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          syncRecipeOrder();
          setOpen(true);
        }}
        className="fixed bottom-[25rem] right-4 z-40 hidden rounded-full border border-[#d7ded4] bg-white px-4 py-3 text-sm font-semibold text-[#2f6f5f] shadow-lg shadow-black/12 transition hover:-translate-y-0.5 hover:bg-[#f4f6f1] lg:flex lg:items-center lg:gap-2"
      >
        <ListOrdered className="h-4 w-4" aria-hidden="true" />
        레시피 순서
      </button>

      <button
        type="button"
        onClick={() => {
          syncRecipeOrder();
          setOpen(true);
        }}
        className="fixed bottom-20 left-4 z-40 flex rounded-full border border-[#d7ded4] bg-white px-4 py-3 text-sm font-semibold text-[#2f6f5f] shadow-lg shadow-black/12 transition hover:bg-[#f4f6f1] lg:hidden"
      >
        <ListOrdered className="mr-2 h-4 w-4" aria-hidden="true" />
        순서
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
                    위/아래 버튼으로 순서를 바꾸면 브라우저에 저장됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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

                    return (
                      <li
                        key={recipeName}
                        className="rounded-lg border border-[#d7ded4] bg-white p-3 shadow-sm shadow-black/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1d211c]">
                              {index + 1}. {recipeName}
                            </p>
                            <p className="mt-1 text-xs text-[#607064]">
                              {isDefaultRecipe ? "기본 레시피" : "추천/나만의 레시피"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveRecipe(index, -1)}
                              disabled={index === 0}
                              aria-label={`${recipeName} 위로 이동`}
                              className="rounded-md border border-[#d7ded4] p-2 text-[#607064] transition hover:bg-[#eef5ef] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowUp className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRecipe(index, 1)}
                              disabled={index === recipeNames.length - 1}
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
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#607064] transition hover:bg-[#f4f6f1]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  기본 순서
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
