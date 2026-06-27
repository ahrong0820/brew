import { copyCurrentBestToCustomRecipe } from "@/lib/customRecipes/currentBestCopy";
import { beanStore } from "@/lib/storage/coffeeData";
import type { BrewSession } from "@/lib/types/coffee";

export function syncSuccessfulRecipe(session: BrewSession) {
  if (typeof window === "undefined") return;
  const bean = beanStore.getById(session.beanId);
  if (bean) copyCurrentBestToCustomRecipe(bean, session);
}
