"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import type { Recipe } from "@/lib/types/defaultRecipe";

export const recipeOrderStorageKey = "brew.recipeDisplayOrder.v1";

type RecipeOrderSnapshot = {
  recipes: readonly Recipe[];
  orderIds: readonly string[];
  orderedRecipes: readonly Recipe[];
};

const listeners = new Set<() => void>();
let snapshot: RecipeOrderSnapshot = {
  recipes: [],
  orderIds: [],
  orderedRecipes: [],
};
let hydrated = false;

function unique(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sameIds(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameRecipeRefs(left: readonly Recipe[], right: readonly Recipe[]) {
  return left.length === right.length && left.every((recipe, index) => recipe === right[index]);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return snapshot;
}

function readStoredOrder() {
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

function writeStoredOrder(orderIds: readonly string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(recipeOrderStorageKey, JSON.stringify(orderIds));
  } catch {
    // Keep the in-memory order usable when storage is unavailable.
  }
}

export function resolveStoredRecipeOrder(
  storedOrder: readonly string[],
  recipes: readonly Recipe[],
) {
  const idSet = new Set(recipes.map((recipe) => recipe.id));
  const idByName = new Map(recipes.map((recipe) => [recipe.name, recipe.id]));

  return unique(
    storedOrder
      .map((value) => (idSet.has(value) ? value : idByName.get(value) ?? ""))
      .filter(Boolean),
  );
}

export function reconcileRecipeOrder(
  recipeIds: readonly string[],
  storedOrderIds: readonly string[],
) {
  const currentIds = unique(recipeIds);
  const currentIdSet = new Set(currentIds);
  const preservedIds = unique(storedOrderIds).filter((id) => currentIdSet.has(id));
  const preservedIdSet = new Set(preservedIds);

  return [
    ...preservedIds,
    ...currentIds.filter((id) => !preservedIdSet.has(id)),
  ];
}

export function moveRecipeId(
  orderIds: readonly string[],
  recipeId: string,
  direction: -1 | 1,
) {
  const index = orderIds.indexOf(recipeId);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= orderIds.length) {
    return [...orderIds];
  }

  const nextOrder = [...orderIds];
  [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
  return nextOrder;
}

export function moveRecipeIdToTarget(
  orderIds: readonly string[],
  recipeId: string,
  targetId: string,
) {
  const fromIndex = orderIds.indexOf(recipeId);
  const targetIndex = orderIds.indexOf(targetId);

  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) {
    return [...orderIds];
  }

  const nextOrder = [...orderIds];
  nextOrder.splice(fromIndex, 1);
  nextOrder.splice(targetIndex, 0, recipeId);
  return nextOrder;
}

function orderRecipes(recipes: readonly Recipe[], orderIds: readonly string[]) {
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  return orderIds
    .map((id) => recipeById.get(id))
    .filter((recipe): recipe is Recipe => Boolean(recipe));
}

function applyOrder(nextOrderIds: readonly string[]) {
  const recipeIds = snapshot.recipes.map((recipe) => recipe.id);
  const reconciledOrder = reconcileRecipeOrder(recipeIds, nextOrderIds);

  if (sameIds(snapshot.orderIds, reconciledOrder)) {
    return;
  }

  snapshot = {
    recipes: snapshot.recipes,
    orderIds: reconciledOrder,
    orderedRecipes: orderRecipes(snapshot.recipes, reconciledOrder),
  };
  writeStoredOrder(reconciledOrder);
  emitChange();
}

function registerRecipes(recipes: readonly Recipe[]) {
  const recipeIds = recipes.map((recipe) => recipe.id);
  let sourceOrder = snapshot.orderIds;

  if (!hydrated) {
    sourceOrder = resolveStoredRecipeOrder(readStoredOrder(), recipes);
    hydrated = true;
  }

  const nextOrderIds = reconcileRecipeOrder(recipeIds, sourceOrder);

  if (sameRecipeRefs(snapshot.recipes, recipes) && sameIds(snapshot.orderIds, nextOrderIds)) {
    return;
  }

  snapshot = {
    recipes,
    orderIds: nextOrderIds,
    orderedRecipes: orderRecipes(recipes, nextOrderIds),
  };
  writeStoredOrder(nextOrderIds);
  emitChange();
}

export function useRecipeOrder(
  recipes?: readonly Recipe[],
  options: { ready?: boolean } = {},
) {
  const ready = options.ready ?? true;
  const sharedSnapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (recipes && ready) {
      registerRecipes(recipes);
    }
  }, [ready, recipes]);

  const inputRecipeIds = useMemo(
    () => (recipes ? recipes.map((recipe) => recipe.id) : []),
    [recipes],
  );
  const fallbackOrderIds = useMemo(
    () => reconcileRecipeOrder(inputRecipeIds, sharedSnapshot.orderIds),
    [inputRecipeIds, sharedSnapshot.orderIds],
  );
  const fallbackOrderedRecipes = useMemo(
    () => (recipes ? orderRecipes(recipes, fallbackOrderIds) : []),
    [fallbackOrderIds, recipes],
  );
  const sharedMatchesInput = recipes
    ? sameRecipeRefs(sharedSnapshot.recipes, recipes)
    : sharedSnapshot.recipes.length > 0;

  return {
    recipes: sharedMatchesInput ? sharedSnapshot.recipes : recipes ?? [],
    orderIds: sharedMatchesInput ? sharedSnapshot.orderIds : fallbackOrderIds,
    orderedRecipes: sharedMatchesInput
      ? sharedSnapshot.orderedRecipes
      : fallbackOrderedRecipes,
    moveRecipe(recipeId: string, direction: -1 | 1) {
      applyOrder(moveRecipeId(snapshot.orderIds, recipeId, direction));
    },
    moveRecipeToTarget(recipeId: string, targetId: string) {
      applyOrder(moveRecipeIdToTarget(snapshot.orderIds, recipeId, targetId));
    },
    resetOrder() {
      applyOrder(snapshot.recipes.map((recipe) => recipe.id));
    },
  };
}
