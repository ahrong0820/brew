import { baristaRecipes } from "#barista-recipes";
import { rankingBoost } from "#ranking-boost";
import type {
  BaristaRecipe,
  BaristaRecipeMatch,
  BaristaRecipeMatchInput,
} from "@/lib/types/baristaRecipe";
import type { ProcessMethod, RoastLevel, TasteGoal } from "@/lib/types/coffee";

const tasteLabels: Record<TasteGoal, string> = {
  sweet: "단맛",
  bright: "산미·향미",
  balanced: "밸런스",
  body: "바디감",
};
const roastLabels: Record<RoastLevel, string> = {
  light: "약배전",
  "medium-light": "중약배전",
  medium: "중배전",
  "medium-dark": "중강배전",
  dark: "강배전",
  unknown: "미확인 배전도",
};
const processLabels: Record<ProcessMethod, string> = {
  washed: "워시드",
  natural: "내추럴",
  honey: "허니",
  fermented: "발효 가공",
  unknown: "미확인 가공 방식",
};

function flavorMatches(recipe: BaristaRecipe, notes: readonly string[]) {
  const normalized = notes.map((note) => note.trim().toLocaleLowerCase("ko-KR"));
  return recipe.flavorKeywords.filter((keyword) => {
    const value = keyword.toLocaleLowerCase("ko-KR");
    return normalized.some((note) => note.includes(value) || value.includes(note));
  });
}

function originConnection(
  recipe: BaristaRecipe,
  input: BaristaRecipeMatchInput,
) {
  const group = input.originGroup;
  if (!group || group === "unknown" || group === "other") return null;
  if (group === "east-africa" && recipe.tasteProfile.bright >= 4) {
    return { score: 4, reason: "동아프리카 원두의 선명한 향미 방향과 연결됩니다." };
  }
  if (
    (group === "latin-america" || group === "brazil") &&
    (recipe.tasteProfile.sweet >= 4 || recipe.tasteProfile.balanced >= 4)
  ) {
    return { score: 4, reason: "중남미·브라질 원두의 단맛과 균형 방향에 맞습니다." };
  }
  if (group === "asia" && (recipe.tasteProfile.body >= 4 || recipe.tasteProfile.sweet >= 4)) {
    return { score: 3, reason: "아시아 원두의 바디와 단맛 방향에 맞습니다." };
  }
  if (group === "blend" && recipe.tasteProfile.balanced >= 4) {
    return { score: 3, reason: "블렌드의 균형 중심 목표와 연결됩니다." };
  }
  return null;
}

function varietyConnection(
  recipe: BaristaRecipe,
  variety: string | undefined,
) {
  const normalized = variety?.trim().toLocaleLowerCase("en-US");
  if (!normalized) return null;
  if (
    ["gesha", "geisha", "heirloom"].some((name) => normalized.includes(name)) &&
    recipe.tasteProfile.bright >= 4
  ) {
    return { score: 4, reason: `${variety}의 향미 표현 방향과 연결됩니다.` };
  }
  if (
    ["bourbon", "caturra", "catuai", "catuaí"].some((name) =>
      normalized.includes(name),
    ) &&
    (recipe.tasteProfile.sweet >= 4 || recipe.tasteProfile.balanced >= 4)
  ) {
    return { score: 3, reason: `${variety}의 단맛·균형 방향과 연결됩니다.` };
  }
  return null;
}

function scoreRecipe(
  recipe: BaristaRecipe,
  input: BaristaRecipeMatchInput,
): BaristaRecipeMatch {
  const reasons: string[] = [
    `[맛 목표] ${tasteLabels[input.tasteGoal]} 적합도 ${recipe.tasteProfile[input.tasteGoal]}/5`,
  ];
  let score = recipe.tasteProfile[input.tasteGoal] * 12;

  if (input.roastLevel === "unknown") score += 5;
  else if (recipe.suitableRoasts.includes(input.roastLevel)) {
    score += 18;
    reasons.push(`[원두 적합] ${roastLabels[input.roastLevel]} 적용 범위입니다.`);
  }
  if (input.process === "unknown") score += 2;
  else if (recipe.suitableProcesses.includes(input.process)) {
    score += 10;
    reasons.push(`[원두 적합] ${processLabels[input.process]} 가공에 맞습니다.`);
  }

  const origin = originConnection(recipe, input);
  if (origin) {
    score += origin.score;
    reasons.push(`[산지 연결] ${origin.reason}`);
  }
  const variety = varietyConnection(recipe, input.variety);
  if (variety) {
    score += variety.score;
    reasons.push(`[품종 연결] ${variety.reason}`);
  }

  const doseDifference = Math.abs(recipe.doseGrams - input.doseGrams);
  if (doseDifference <= 2) {
    score += 6;
    reasons.push(`[용량 적합] 원본 ${recipe.doseGrams}g과 변환 폭이 작습니다.`);
  } else if (doseDifference <= 5) {
    score += 3;
    reasons.push(`[용량 적합] ${input.doseGrams}g으로 비례 조정합니다.`);
  }

  const flavors = flavorMatches(recipe, input.flavorNotes ?? []);
  if (flavors.length > 0) {
    score += Math.min(6, flavors.length * 2);
    reasons.push(`[향미 연결] ${flavors.slice(0, 3).join(", ")} 특성과 연결됩니다.`);
  }

  const personal = rankingBoost(recipe.id, input);
  score += personal;
  if (personal === 20) reasons.push("[개인 성공] 안정 설정을 우선 반영합니다.");
  if (personal === 10) reasons.push("[개인 성공] 잠정 설정을 반영합니다.");
  reasons.push(`[난이도] ${recipe.difficulty}`);

  return { recipe, score: Math.min(100, score), reasons };
}

function personalPriority(recipeId: string, input: BaristaRecipeMatchInput) {
  const status = input.personalRecipeStatuses?.[recipeId];
  if (status === "stable") return 2;
  if (status === "provisional") return 1;
  return 0;
}

function allMatches(input: BaristaRecipeMatchInput) {
  return baristaRecipes
    .filter(
      (recipe) =>
        recipe.brewerType === input.brewerType &&
        recipe.drinkStyle === input.drinkStyle &&
        input.doseGrams >= recipe.supportedDoseGrams.min &&
        input.doseGrams <= recipe.supportedDoseGrams.max,
    )
    .map((recipe) => scoreRecipe(recipe, input))
    .sort(
      (left, right) =>
        right.score - left.score ||
        personalPriority(right.recipe.id, input) -
          personalPriority(left.recipe.id, input) ||
        left.recipe.id.localeCompare(right.recipe.id),
    );
}

export function rankBaristaRecipes(input: BaristaRecipeMatchInput, limit = 3) {
  return limit <= 0 ? [] : allMatches(input).slice(0, limit);
}

export function selectBaristaRecipe(
  input: BaristaRecipeMatchInput,
  preferredRecipeId?: string,
) {
  const matches = allMatches(input);
  return preferredRecipeId
    ? matches.find((match) => match.recipe.id === preferredRecipeId)
    : matches[0];
}
