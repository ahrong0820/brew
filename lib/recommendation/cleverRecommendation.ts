import type { BaristaRecipe } from "@/lib/types/baristaRecipe";
import type { GrinderProfile, RoastLevel } from "@/lib/types/coffee";
import type {
  AppliedRecommendationRule,
  BrewRecommendation,
  GrinderRecommendation,
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

export function cleverTiming(
  recipe: Pick<BaristaRecipe, "steps">,
  immersionOffsetSeconds = 0,
) {
  const drawdown = recipe.steps.find((step) =>
    `${step.label} ${step.cue}`.includes("드로다운"),
  );
  const immersionSeconds = clamp(
    (drawdown?.startSeconds ?? 120) + immersionOffsetSeconds,
    60,
    240,
  );
  return {
    immersionSeconds,
    drawdownMinSeconds: 45,
    drawdownMaxSeconds: 75,
    totalMinSeconds: immersionSeconds + 45,
    totalMaxSeconds: immersionSeconds + 75,
  };
}

function parsedNumbers(value: string | undefined) {
  return (value?.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

function formatGrindValue(value: number, profile: GrinderProfile) {
  return profile.displayUnit === "dial"
    ? value.toFixed(1)
    : String(Math.round(value));
}

export function cleverGrindRange(
  grinder: GrinderRecommendation,
  profile: GrinderProfile,
) {
  if (!grinder.isNumeric) return grinder.displayRange;
  const start = Number.parseFloat(grinder.displayValue);
  if (!Number.isFinite(start)) return grinder.displayRange;

  const safeNumbers = parsedNumbers(grinder.safeRangeLabel ?? grinder.displayRange);
  const safeMin = safeNumbers.length >= 2 ? Math.min(...safeNumbers) : -Infinity;
  const safeMax = safeNumbers.length >= 2 ? Math.max(...safeNumbers) : Infinity;
  const span =
    profile.displayUnit === "dial"
      ? 0.5
      : profile.displayUnit === "click"
        ? 4
        : Math.max(2, (profile.displayStep ?? 1) * 3);
  const min = clamp(start - span, safeMin, safeMax);
  const max = clamp(start + span, safeMin, safeMax);
  return `${formatGrindValue(min, profile)}~${formatGrindValue(max, profile)}`;
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
        "grind.clever.model-window.v1",
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
    recipeRule(
      "grind.clever.model-window.v1",
      "grind",
      "현재 그라인더의 변환 시작값과 안전 범위 안에서 클레버 전용 탐색 범위를 제시",
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
  const immersionOffset = input.recommendationOffset?.["immersion-time"] ?? 0;
  const agitationOffset = input.recommendationOffset?.agitation ?? 0;
  const agitationCount = clamp(1 + agitationOffset, 0, 2);
  const timing = cleverTiming(recipe, immersionOffset);
  const temperatureOffset = input.recommendationOffset?.temperature ?? 0;
  const unadjustedFallback = recommendation.temperatureCelsius - temperatureOffset;
  const temperatureCelsius = clamp(
    cleverTemperatureForRoast(input.bean.roastLevel, unadjustedFallback) +
      temperatureOffset,
    82,
    96,
  );
  const orderLabel = order === "water-first" ? "물 먼저" : "커피 먼저";
  const agitationLabel =
    agitationCount === 0 ? "교반 생략" : `교반 ${agitationCount}회`;
  const grindRange = cleverGrindRange(recommendation.grinder, input.grinder);
  const steps = recommendation.steps.map((step) => {
    const text = `${step.label} ${step.cue}`;
    if (text.includes("드로다운")) {
      return {
        ...step,
        startSeconds: timing.immersionSeconds,
        cue: `${timing.immersionSeconds}초 침출 후 서버에 올리고, 드로다운 ${timing.drawdownMinSeconds}~${timing.drawdownMaxSeconds}초를 별도로 관찰하세요.`,
      };
    }
    if (text.includes("커피") || text.includes("교반")) {
      return {
        ...step,
        cue:
          agitationCount === 0
            ? `${step.cue} 이번 추출은 교반 생략으로 비교합니다.`
            : `${step.cue} 교반은 마른 가루가 사라질 정도로 ${agitationCount}회만 짧게 합니다.`,
      };
    }
    return step;
  });

  return {
    ...recommendation,
    temperatureCelsius,
    targetTimeMinSeconds: timing.totalMinSeconds,
    targetTimeMaxSeconds: timing.totalMaxSeconds,
    grinder: {
      ...recommendation.grinder,
      displayRange: grindRange,
      note: `${recommendation.grinder.note} 클레버는 변환 시작값 주변의 ${grindRange}를 전용 탐색 범위로 사용합니다.`,
    },
    steps,
    reasons: [
      ...recommendation.reasons,
      `[클레버 구조] ${orderLabel} 투입, ${agitationLabel}, 침출 ${timing.immersionSeconds}초를 분리해 적용했습니다.`,
      `[클레버 드로다운] 배출 ${timing.drawdownMinSeconds}~${timing.drawdownMaxSeconds}초를 별도 평가합니다.`,
      `[클레버 분쇄] ${input.grinder.displayName}의 변환 시작값 주변 ${grindRange}를 안전 탐색 범위로 제한했습니다.`,
      `[배전도 온도] ${input.bean.roastLevel} 배전에 맞춰 ${temperatureCelsius}℃를 시작값으로 적용했습니다.`,
    ],
    confidence: "reference",
    confidenceReason:
      "클레버 전용 분쇄·교반·침출·드로다운 구조를 적용했지만 원본 레시피 수치는 1차 출처 검증 전이므로 참고값입니다. 실제 드로다운과 맛 평가를 기록해 개인 성공값을 우선하세요.",
    appliedRules: replaceRules(recommendation.appliedRules, recipe),
  };
}
