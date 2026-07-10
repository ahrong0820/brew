import {
  copyCurrentBestToCustomRecipe,
  customRecipeImportedEvent,
} from "@/lib/customRecipes/currentBestCopy";
import {
  customRecipesStorageKey,
  repairStoredCustomRecipeStorage,
} from "@/lib/recipes/customRecipeSchema";
import { writeJsonStorage } from "@/lib/storage/browserJsonStorage";
import {
  beanBrewProfileStore,
  beanStore,
} from "@/lib/storage/coffeeData";
import type { BrewSession } from "@/lib/types/coffee";

export function syncSuccessfulRecipe(session: BrewSession) {
  if (typeof window === "undefined") return;
  const bean = beanStore.getById(session.beanId);
  const profile = beanBrewProfileStore.getById(session.profileId);
  if (!bean || !profile?.personalRecipe) return;

  const copied = copyCurrentBestToCustomRecipe(bean, session);
  const items = repairStoredCustomRecipeStorage(window.localStorage).recipes;
  const enriched = {
    ...copied,
    name: `${bean.name} · 개인 맞춤`,
    sourceBaristaRecipeId: profile.sourceRecipeId,
    personalRecipeStatus: profile.personalRecipe.status,
    personalRecipeVersion: profile.personalRecipe.version,
    successfulBrewCount: profile.personalRecipe.successfulBrewCount,
    personalRecipeVersions: profile.personalRecipe.versions,
  };
  const nextItems = items.map((item) =>
    item.id === copied.id ? enriched : item,
  );
  const writeResult = writeJsonStorage(
    window.localStorage,
    customRecipesStorageKey,
    nextItems,
  );
  if (!writeResult.ok) {
    throw new Error("성공 레시피를 나만의 레시피 저장소에 반영하지 못했습니다.");
  }
  window.dispatchEvent(
    new CustomEvent(customRecipeImportedEvent, {
      detail: { recipe: enriched },
    }),
  );
  return enriched;
}
