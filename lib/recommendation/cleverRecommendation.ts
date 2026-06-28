import type { BaristaRecipe } from "@/lib/types/baristaRecipe";
import type { RoastLevel } from "@/lib/types/coffee";
import type {
  AppliedRecommendationRule,
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export type CleverLoadingOrder = "water-first" | "coffee-first";

const roastTemperatures: Readonly<Record<RoastLevel, number | undefined>> = {
  light: 95,
  "medium-light": 94,
  medium: 92,
  "medium-dark": 90,
  dark: 88,
  unknown: undefined,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function cleverTemperatureForRoast(
  roastLevel: RoastLevel,
  fallback: number,
) {
  return roastTemperatures[roastLevel] ?? fallback;
}

export function cleverLoadingOrder(
  recipe: Pick<BaristaRecipe, "steps">,
): CleverLoadingOrder {
  const first = recipe.steps[0];
  const text = `${first?.label ?? ""} ${first?.cue ?? ""}`;
  return text.includes("물") ? "water-first" : "coffee-first";
}

export function cleverTiming(recipe: Pick<BaristaRecipe, "steps">) {
  const drawdown = recipe.steps.find((step) =>
    `${step.label} ${step.cue}`.includes("드로다운"),
  );
  const immersionSeconds = Math.max(30, drawdown?.startSeconds ?? 120);
  return {
    immersionSeconds,
    drawdownMinSeconds: 45,
    drawdownMaxSeconds: 75,
    totalMinSeconds: immersionSeconds + 45,
    totalMaxSeconds: immersionSeconds + 75,
  };
}

function recipeRule(
  id: string,
  parameter: AppliedRecommendationRule["parameter"],
  description: string,
  recipe: BaristaRecipe,
): AppliedRecommendationRule {
  return {
    id,
    parameter,
    description,
    evidence: [
      {
        kind: "heuristic",
        sourceId: `barista-recipe:${recipe.id}`,
        role: "context",
        applicability: "partial",
        note: "클레버 침출식 조정 규칙입니다. 원본 수치가 1차 출처로 확정되기 전까지 참고값으로 표시합니다.",
      },
    ],
  };
}

function replaceRules(
  rules: readonly AppliedRecommendationRule[] | undefined,
  recipe: BaristaRecipe,
) {
  const preserved = (rules ?? []).filter(
    (rule) =>
      ![
        "pour.clever.immersion-structure.v1",
        "time.clever.immersion-drawdown.v1",
        "temperature.clever.roast.v1",
      ].includes(rule.id),
  );
  return [
    ...preserved,
    recipeRule(
      "pour.clever.immersion-structure.v1",
      "pour",
      "클레버의 투입 순서·교반·침출·드로다운 단계를 V60 푸어 구조와 분리",
      recipe,
    ),
    recipeRule(
      "time.clever.immersion-drawdown.v1",
      "time",
      "클레버 침출 시간과 드로다운 목표 시간을 별도로 관리",
      recipe,
    ),
    recipeRule(
      "temperature.clever.roast.v1",
      "temperature",
      "클레버 시작 온도를 배전도별 범위로 보정",
      recipe,
    ),
  ];
}

export function applyCleverRecommendationProfile(
  recommendation: BrewRecommendation,
  recipe: BaristaRecipe,
  input: RecommendationInput,
): BrewRecommendation {
  if (recipe.brewerType !== "clever") return recommendation;

  const order = cleverLoadingOrder(recipe);
  const timing = cleverTiming(recipe);
  const temperatureCelsius = clamp(
    cleverTemperatureForRoast(
      input.bean.roastLevel,
      recommendation.temperatureCelsius,
    ) + (input.recommendationOffset?.temperature ?? 0),
    82,
    96,
  );
  const orderLabel = order === "water-first" ? "물 먼저" : "커피 먼저";
  const steps = recommendation.steps.map((step) => {
    const text = `${step.label} ${step.cue}`;
    if (text.includes("드로다운")) {
      return {
        ...step,
        cue: `${timing.immersionSeconds}초 침출 후 서버에 올리고, 드로다운 ${timing.drawdownMinSeconds}~${timing.drawdownMaxSeconds}초를 별도로 관찰하세요.`,
      };
    }
    if (text.includes("커피") || text.includes("교반")) {
      return {
        ...step,
        cue: `${step.cue} 교반은 마른 가루가 사라질 정도로 1회만 짧게 합니다.`,
      };
    }
    return step;
  });

  return {
    ...recommendation,
    temperatureCelsius,
    targetTimeMinSeconds: timing.totalMinSeconds,
    targetTimeMaxSeconds: timing.totalMaxSeconds,
    steps,
    reasons: [
      ...recommendation.reasons,
      `[클레버 구조] ${orderLabel} 투입, 교반 1회, 침출 ${timing.immersionSeconds}초를 분리해 적용했습니다.`,
      `[클레버 드로다운] 배출 ${timing.drawdownMinSeconds}~${timing.drawdownMaxSeconds}초를 별도 평가합니다.`,
      `[배전도 온도] ${input.bean.roastLevel} 배전에 맞춰 ${temperatureCelsius}℃를 시작값으로 적용했습니다.`,
    ],
    confidence: "reference",
    confidenceReason:
      "클레버 전용 침출·드로다운 구조를 적용했지만 원본 레시피 수치는 1차 출처 검증 전이므로 참고값입니다. 실제 드로다운과 맛 평가를 기록해 개인 성공값을 우선하세요.",
    appliedRules: replaceRules(recommendation.appliedRules, recipe),
  };
}
