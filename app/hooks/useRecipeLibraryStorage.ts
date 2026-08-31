"use client";

import { useCallback, useEffect, useState } from "react";

import {
  customRecipesStorageKey,
  repairStoredCustomRecipeStorage,
} from "@/lib/recipes/customRecipeSchema";
import { writeJsonStorage } from "@/lib/storage/browserJsonStorage";
import type { Recipe } from "@/lib/types/defaultRecipe";

const favoritesStorageKey = "coffee-recipe-favorites";

function getStoredFavorites() {
  if (typeof window === "undefined") return [];

  try {
    const storedValue = window.localStorage.getItem(favoritesStorageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function getStoredCustomRecipes() {
  if (typeof window === "undefined") return [];

  try {
    return repairStoredCustomRecipeStorage(window.localStorage).recipes;
  } catch {
    return [];
  }
}

export function useRecipeLibraryStorage() {
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [storageErrors, setStorageErrors] = useState<{
    favorites: string | null;
    customRecipes: string | null;
  }>({ favorites: null, customRecipes: null });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFavoriteIds(getStoredFavorites());
      setCustomRecipes(getStoredCustomRecipes());
      setStorageLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;

    const result = writeJsonStorage(
      window.localStorage,
      favoritesStorageKey,
      favoriteIds,
    );
    const timeoutId = window.setTimeout(() => {
      setStorageErrors((current) => ({
        ...current,
        favorites: result.ok
          ? null
          : "즐겨찾기를 브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.",
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [favoriteIds, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;

    const result = writeJsonStorage(
      window.localStorage,
      customRecipesStorageKey,
      customRecipes,
    );
    const timeoutId = window.setTimeout(() => {
      setStorageErrors((current) => ({
        ...current,
        customRecipes: result.ok
          ? null
          : "나만의 레시피를 브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.",
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [customRecipes, storageLoaded]);

  const toggleFavorite = useCallback((recipeId: string) => {
    setFavoriteIds((currentIds) =>
      currentIds.includes(recipeId)
        ? currentIds.filter((id) => id !== recipeId)
        : [...currentIds, recipeId],
    );
  }, []);

  const removeFavorite = useCallback((recipeId: string) => {
    setFavoriteIds((currentIds) => currentIds.filter((id) => id !== recipeId));
  }, []);

  return {
    customRecipes,
    favoriteIds,
    storageLoaded,
    storageNotice: storageErrors.favorites ?? storageErrors.customRecipes,
    setCustomRecipes,
    toggleFavorite,
    removeFavorite,
  };
}
