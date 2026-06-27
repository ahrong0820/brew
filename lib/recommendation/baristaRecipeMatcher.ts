import { baristaRecipes } from "#barista-recipes";
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
  let score = recipe.tasteProfile[input.tasteGoal] * 12;

  reasons.push(
    `원하는 ${tasteGoalLabels[input.tasteGoal]} 방향과 레시피 컵 프로필의 적합도가 ${recipe.tasteProfile[input.tasteGoal]}/5입니다.`,
  );

  if (input.roastLevel === "unknown") {
    score += 5;
    reasons.push("배전도 미입력 상태에서도 사용할 수 있는 참고 후보입니다.");
  } else if (includesValue(recipe.suitableRoasts, input.roastLevel)) {
    score += 18;
    reasons.push(`${roastLabels[input.roastLevel]} 적용 범위에 포함됩니다.`);
  }

  if (input.process === "unknown") {
    score += 2;
  } else if (includesValue(recipe.suitableProcesses, input.process)) {
    score += 10;
    reasons.push(`${processLabels[input.process]} 원두에 적용 가능한 레시피입니다.`);
  }

  const doseDifference = Math.abs(recipe.doseGrams - input.doseGrams);
  if (doseDifference <= 2) {
    score += 6;
    reasons.push(
      `사용 원두량 ${input.doseGrams}g이 원본 ${recipe.doseGrams}g과 가까워 변환 폭이 작습니다.`,
    );
  } else if (doseDifference <= 5) {
    score += 3;
    reasons.push(
      `원본 ${recipe.doseGrams}g을 ${input.doseGrams}g으로 비례 조정할 수 있습니다.`,
    );
  }

  const flavorMatches = matchingFlavorKeywords(
    recipe,
    input.flavorNotes ?? [],
  );
  if (flavorMatches.length > 0) {
    score += Math.min(6, flavorMatches.length * 2);
    reasons.push(
      `입력한 향미와 ${flavorMatches.slice(0, 3).join(", ")} 특성이 연결됩니다.`,
    );
  }

  return {
    recipe,
    score: Math.min(100, score),
    reasons,
  };
}

export function rankBaristaRecipes(
  input: BaristaRecipeMatchInput,
  limit = 3,
): BaristaRecipeMatch[] {
  if (limit <= 0) return [];

  return baristaRecipes
    .filter(
      (recipe) =>
        recipe.brewerType === input.brewerType &&
        recipe.drinkStyle === input.drinkStyle,
    )
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
): BaristaRecipeMatch | undefined {
  return rankBaristaRecipes(input, 1)[0];
}
