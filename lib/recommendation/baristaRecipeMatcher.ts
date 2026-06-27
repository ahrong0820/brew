import { baristaRecipes } from "#barista-recipes";
import { rankingBoost } from "@/lib/recommendation/rankingBoost";
import type {
  BaristaRecipe,
  BaristaRecipeMatch,
  BaristaRecipeMatchInput,
} from "@/lib/types/baristaRecipe";
import type {
  ProcessMethod,
  RoastLevel,
  TasteGoal,
} from "@/lib/types/coffee";

const tasteGoalLabels: Record<TasteGoal, string> = {
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

function normalizedText(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function includesValue<T>(values: readonly T[], value: T) {
  return values.includes(value);
}

function matchingFlavorKeywords(
  recipe: BaristaRecipe,
  flavorNotes: readonly string[],
) {
  const notes = flavorNotes.map(normalizedText).filter(Boolean);
  if (notes.length === 0) return [];

  return recipe.flavorKeywords.filter((keyword) => {
    const normalizedKeyword = normalizedText(keyword);
    return notes.some(
      (note) =>
        note.includes(normalizedKeyword) || normalizedKeyword.includes(note),
    );
  });
}

function scoreRecipe(
  recipe: BaristaRecipe,
  input: BaristaRecipeMatchInput,
): BaristaRecipeMatch {
  const reasons: string[] = [];
  let score = recipe.tasteProfile[input.tasteGoal] * 10;

  reasons.push(
    `[맛 목표] ${tasteGoalLabels[input.tasteGoal]} 적합도 ${recipe.tasteProfile[input.tasteGoal]}/5`,
  );

  if (input.roastLevel === "unknown") {
    score += 4;
    reasons.push("[원두 적합] 배전도 미입력 상태의 참고 후보입니다.");
  } else if (includesValue(recipe.suitableRoasts, input.roastLevel)) {
    score += 18;
    reasons.push(`[원두 적합] ${roastLabels[input.roastLevel]} 적용 범위입니다.`);
  }

  if (input.process === "unknown") {
    score += 2;
  } else if (includesValue(recipe.suitableProcesses, input.process)) {
    score += 10;
    reasons.push(`[원두 적합] ${processLabels[input.process]} 가공에 맞습니다.`);
  }

  const doseDifference = Math.abs(recipe.doseGrams - input.doseGrams);
  if (doseDifference <= 2) {
    score += 8;
    reasons.push(`[용량 적합] 원본 ${recipe.doseGrams}g과 변환 폭이 작습니다.`);
  } else if (doseDifference <= 5) {
    score += 4;
    reasons.push(`[용량 적합] ${input.doseGrams}g으로 비례 조정합니다.`);
  }

  const flavorMatches = matchingFlavorKeywords(
    recipe,
    input.flavorNotes ?? [],
  );
  if (flavorMatches.length > 0) {
    score += Math.min(8, flavorMatches.length * 2);
    reasons.push(
      `[향미 연결] ${flavorMatches.slice(0, 3).join(", ")} 특성과 연결됩니다.`,
    );
  }

  const personalScore = rankingBoost(recipe.id, input);
  if (personalScore === 20) {
    reasons.push("[개인 성공] 재현된 안정 설정을 우선 반영합니다.");
  } else if (personalScore === 10) {
    reasons.push("[개인 성공] 성공 1회의 잠정 설정을 반영합니다.");
  }
  score += personalScore;

  reasons.push(
    `[난이도] ${recipe.difficulty === "easy" ? "쉬움" : recipe.difficulty === "medium" ? "보통" : "고급"}`,
  );

  return {
    recipe,
    score: Math.min(100, score),
    reasons,
  };
}

function eligibleBaristaRecipes(input: BaristaRecipeMatchInput) {
  return baristaRecipes.filter(
    (recipe) =>
      recipe.brewerType === input.brewerType &&
      recipe.drinkStyle === input.drinkStyle &&
      input.doseGrams >= recipe.supportedDoseGrams.min &&
      input.doseGrams <= recipe.supportedDoseGrams.max,
  );
}

export function rankBaristaRecipes(
  input: BaristaRecipeMatchInput,
  limit = 3,
): BaristaRecipeMatch[] {
  if (limit <= 0) return [];

  return eligibleBaristaRecipes(input)
    .map((recipe) => scoreRecipe(recipe, input))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.recipe.id.localeCompare(right.recipe.id),
    )
    .slice(0, limit);
}

export function selectBaristaRecipe(
  input: BaristaRecipeMatchInput,
  preferredRecipeId?: string,
): BaristaRecipeMatch | undefined {
  const matches = eligibleBaristaRecipes(input)
    .map((recipe) => scoreRecipe(recipe, input))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.recipe.id.localeCompare(right.recipe.id),
    );

  if (preferredRecipeId) {
    return matches.find((match) => match.recipe.id === preferredRecipeId);
  }

  return matches[0];
}
