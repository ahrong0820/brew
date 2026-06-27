import type { BaristaRecipeMatchInput } from "@/lib/types/baristaRecipe";

type PersonalRecipeStatus = "provisional" | "stable";

type StoredProfile = {
  sourceRecipeId?: unknown;
  brewerType?: unknown;
  drinkStyle?: unknown;
  personalRecipe?: {
    status?: unknown;
  };
};

function boostForStatus(status: unknown) {
  if (status === "stable") return 20;
  if (status === "provisional") return 10;
  return 0;
}

function storedProfiles(): StoredProfile[] {
  if (typeof window === "undefined" || !window.localStorage) return [];

  try {
    const raw = window.localStorage.getItem("brew.beanBrewProfiles.v1");
    if (!raw) return [];

    const parsed = JSON.parse(raw) as {
      version?: unknown;
      items?: unknown;
    };
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) return [];

    return parsed.items.filter(
      (item): item is StoredProfile => typeof item === "object" && item !== null,
    );
  } catch {
    return [];
  }
}

export function rankingBoost(recipeId: string, input: BaristaRecipeMatchInput) {
  const explicitStatus = input.personalRecipeStatuses?.[recipeId];
  const explicitBoost = boostForStatus(explicitStatus);
  if (explicitBoost > 0) return explicitBoost;

  const matchingProfiles = storedProfiles().filter(
    (profile) =>
      profile.sourceRecipeId === recipeId &&
      profile.brewerType === input.brewerType &&
      (profile.drinkStyle ?? "hot") === input.drinkStyle,
  );

  if (
    matchingProfiles.some(
      (profile) => boostForStatus(profile.personalRecipe?.status) === 20,
    )
  ) {
    return 20;
  }
  if (
    matchingProfiles.some(
      (profile) => boostForStatus(profile.personalRecipe?.status) === 10,
    )
  ) {
    return 10;
  }
  return 0;
}
