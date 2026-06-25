import {
  drinkStyleLabel,
  normalizeDrinkStyle,
} from "@/lib/brew/profileIdentity";
import type {
  Bean,
  BrewSession,
  BrewerType,
  TasteGoal,
} from "@/lib/types/coffee";

const customRecipesStorageKey = "coffee-custom-recipes";

export const customRecipeImportedEvent = "coffee:custom-recipe-imported";

export type CurrentBestCopyAction = "created" | "updated" | "unchanged";

export interface LegacyCustomRecipeStep {
  label: string;
  start: number;
  end: number;
  targetWater: number;
  cue: string;
}

export interface LegacyCustomRecipe {
  id: string;
  name: string;
  origin: string;
  method: string;
  profile: string;
  tags: string[];
  dose: number;
  water: number;
  ratio: string;
  temp: string;
  grind: string;
  totalTime: number;
  notes: string[];
  steps: LegacyCustomRecipeStep[];
  sourceCurrentBestProfileId?: string;
  sourceCurrentBestSessionId?: string;
  copyAction?: CurrentBestCopyAction;
}

export interface CustomRecipeImportedDetail {
  recipe: LegacyCustomRecipe;
}

const brewerLabels: Record<BrewerType, string> = {
  v60: "V60",
  clever: "클레버",
  switch: "하리오 스위치",
  other: "기타 드리퍼",
};

const tasteLabels: Record<TasteGoal, string> = {
  sweet: "단맛 중심",
  bright: "산미·향미 중심",
  balanced: "밸런스 중심",
  body: "바디감 중심",
};

function readStoredItems(): unknown[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(customRecipesStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isLegacyCustomRecipe(value: unknown): value is LegacyCustomRecipe {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<LegacyCustomRecipe>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.method === "string" &&
    typeof candidate.dose === "number" &&
    typeof candidate.water === "number" &&
    Array.isArray(candidate.tags) &&
    Array.isArray(candidate.steps)
  );
}

function nextCustomRecipeId(items: unknown[]) {
  const highestIndex = items.reduce<number>((highest, item) => {
    if (typeof item !== "object" || item === null) {
      return highest;
    }

    const id = (item as { id?: unknown }).id;
    if (typeof id !== "string" || !id.startsWith("custom-")) {
      return highest;
    }

    const index = Number(id.replace("custom-", ""));
    return Number.isFinite(index) ? Math.max(highest, index) : highest;
  }, 0);

  return `custom-${highestIndex + 1}`;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function buildSteps(
  session: BrewSession,
  totalTime: number,
): LegacyCustomRecipeStep[] {
  const snapshotSteps = session.recipeSnapshot.steps;

  return snapshotSteps.map((step, index) => ({
    label: step.label,
    start: step.startSeconds,
    end: index === snapshotSteps.length - 1 ? totalTime : step.endSeconds,
    targetWater: step.targetWaterGrams,
    cue: step.cue,
  }));
}

function writeStoredItems(items: unknown[]) {
  try {
    window.localStorage.setItem(
      customRecipesStorageKey,
      JSON.stringify(items),
    );
  } catch {
    throw new Error("나만의 레시피 저장소에 복사하지 못했습니다.");
  }
}

function withoutCopyAction(recipe: LegacyCustomRecipe): LegacyCustomRecipe {
  const { copyAction: _copyAction, ...storedRecipe } = recipe;
  return storedRecipe;
}

export function copyCurrentBestToCustomRecipe(
  bean: Bean,
  session: BrewSession,
): LegacyCustomRecipe {
  if (typeof window === "undefined") {
    throw new Error("브라우저에서만 레시피를 저장할 수 있습니다.");
  }

  const storedItems = readStoredItems();
  const storedRecipes = storedItems.filter(isLegacyCustomRecipe);
  const exactExisting = storedRecipes.find(
    (recipe) =>
      recipe.sourceCurrentBestSessionId === session.id,
  );

  if (exactExisting) {
    return { ...exactExisting, copyAction: "unchanged" };
  }

  const snapshot = session.recipeSnapshot;
  const lastStepStart =
    snapshot.steps[snapshot.steps.length - 1]?.startSeconds ?? 0;
  const preferredTime = session.actualTimeSeconds ?? snapshot.totalTimeSeconds;
  const totalTime = Math.max(lastStepStart + 1, Math.round(preferredTime));
  const method = brewerLabels[snapshot.brewerType];
  const drinkStyle = normalizeDrinkStyle(
    session.drinkStyle ?? snapshot.drinkStyle,
  );
  const styleLabel = drinkStyleLabel(drinkStyle);
  const generatedName = `${bean.name} · ${styleLabel} 현재 베스트`;
  const notes = [
    `음용 방식 ${styleLabel}`,
    "원두별 추출 기록의 현재 베스트에서 복사한 나만의 레시피",
    `성공 추출 시간 ${formatTime(totalTime)}`,
    `복사 기준 ${new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(session.updatedAt))}`,
  ];

  if (session.note && !session.note.includes("타이머 시작 시 자동 생성")) {
    notes.push(session.note);
  }

  const existingForProfile = storedRecipes.find(
    (recipe) =>
      recipe.sourceCurrentBestProfileId === session.profileId ||
      (recipe.name === generatedName &&
        recipe.method === method &&
        recipe.tags.includes("현재 베스트")),
  );
  const recipe: LegacyCustomRecipe = {
    id: existingForProfile?.id ?? nextCustomRecipeId(storedItems),
    name: existingForProfile?.name ?? generatedName,
    origin: "나만의 레시피",
    method,
    profile: `${styleLabel} · ${tasteLabels[session.tasteGoal]} · 현재 베스트`,
    tags: ["나만의 레시피", method, styleLabel, "현재 베스트"],
    dose: snapshot.doseGrams,
    water: snapshot.waterGrams,
    ratio: `1:${snapshot.ratio}`,
    temp: `${snapshot.temperatureCelsius}℃`,
    grind: snapshot.grinderDisplayValue,
    totalTime,
    notes,
    steps: buildSteps(session, totalTime),
    sourceCurrentBestProfileId: session.profileId,
    sourceCurrentBestSessionId: session.id,
  };

  let nextItems: unknown[];
  let copyAction: CurrentBestCopyAction;

  if (existingForProfile) {
    nextItems = storedItems.map((item) =>
      isLegacyCustomRecipe(item) && item.id === existingForProfile.id
        ? withoutCopyAction(recipe)
        : item,
    );
    copyAction = "updated";
  } else {
    nextItems = [withoutCopyAction(recipe), ...storedItems];
    copyAction = "created";
  }

  writeStoredItems(nextItems);

  const result = { ...recipe, copyAction };
  window.dispatchEvent(
    new CustomEvent<CustomRecipeImportedDetail>(customRecipeImportedEvent, {
      detail: { recipe: result },
    }),
  );

  return result;
}
