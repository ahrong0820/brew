import {
  copyCurrentBestToCustomRecipe,
  customRecipeImportedEvent,
} from "@/lib/customRecipes/currentBestCopy";
import {
  beanBrewProfileStore,
  beanStore,
} from "@/lib/storage/coffeeData";
import type { BrewSession } from "@/lib/types/coffee";

const storageKey = "coffee-custom-recipes";

export function syncSuccessfulRecipe(session: BrewSession) {
  if (typeof window === "undefined") return;
  const bean = beanStore.getById(session.beanId);
  const profile = beanBrewProfileStore.getById(session.profileId);
  if (!bean || !profile?.personalRecipe) return;

  const copied = copyCurrentBestToCustomRecipe(bean, session);
  const raw = window.localStorage.getItem(storageKey);
  const items: unknown[] = raw ? JSON.parse(raw) : [];
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
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    item.id === copied.id
      ? enriched
      : item,
  );
  window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
  window.dispatchEvent(
    new CustomEvent(customRecipeImportedEvent, {
      detail: { recipe: enriched },
    }),
  );
  return enriched;
}
