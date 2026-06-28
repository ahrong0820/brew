import type { BaristaRecipe } from "@/lib/types/baristaRecipe";
import type { GrinderProfile, RoastLevel } from "@/lib/types/coffee";
import type {
  AppliedRecommendationRule,
  BrewRecommendation,
  GrinderRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

export type CleverLoadingOrder = "water-first" | "coffee-first";

const jisCleverRecipeId = "jis-clever-1-11";

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

function hasSourceProcedure(recipe: Pick<BaristaRecipe, "id" | "sourceStatus">) {
  return recipe.sourceStatus === "verified" || recipe.id === jisCleverRecipeId;
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
  return text.includes("물") && !text.includes("커피 먼저")
    ? "water-first"
    : "coffee-first";
}

export function cleverTiming(
  recipe: Pick<
    BaristaRecipe,
    "id" | "steps" | "sourceStatus" | "targetTimeMinSeconds" | "targetTimeMaxSeconds"
  >,
  immersionOffsetSeconds = 0,
) {
  const drawdown = recipe.steps.find((step) =>
    `${step.label} ${step.cue}`.includes("드로다운"),
  );
  const baseImmersionSeconds = clamp(drawdown?.startSeconds ?? 120, 60, 240);
  const immersionSeconds = clamp(
    baseImmersionSeconds + immersionOffsetSeconds,
    60,
    240,
  );

  if (hasSourceProcedure(recipe)) {
    const drawdownMinSeconds = Math.max(
      1,
      recipe.targetTimeMinSeconds - baseImmersionSeconds,
    );
    const drawdownMaxSeconds = Math.max(
      drawdownMinSeconds,
      recipe.targetTimeMaxSeconds - baseImmersionSeconds,
    );
    return {
      immersionSeconds,
      drawdownMinSeconds,
      drawdownMaxSeconds,
      totalMinSeconds: immersionSeconds + drawdownMinSeconds,
      totalMaxSeconds: immersionSeconds + drawdownMaxSeconds,
    };
  }

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
  const verified = recipe.sourceStatus === "verified";
  const partial = recipe.id === jisCleverRecipeId;
  return {
    id,
    parameter,
    description,
    evidence: [
      {
        kind: verified ? "manufacturer" : partial ? "expert" : "heuristic",
        sourceId: `barista-recipe:${recipe.id}`,
        role: verified || partial ? "supports" : "context",
        applicability: verified ? "direct" : partial ? "partial" : "partial",
        note: verified
          ? "공식 유통 제품 페이지의 수치와 절차를 정확히 옮긴 클레버 레시피입니다."
          : partial
            ? "정인성 바리스타 본인 채널의 영상 설명에서 1:11 수치와 핵심 절차를 확인했습니다. 온도·분쇄 숫자·배전도·맛 방향은 원본 미확인입니다."
            : "클레버 침출식 조정 규칙입니다. 원본 수치가 1차 출처로 확정되기 전까지 참고값으로 표시합니다.",
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
      recipe.sourceStatus === "verified"
        ? "검증된 클레버 원본 물 온도를 적용"
        : "원본 온도 미확인 상태에서 클레버 시작 온도를 배전도별 범위로 보정",
      recipe,
    ),
    recipeRule(
      "grind.clever.model-window.v1",
      "grind",
      "원본 분쇄 설명과 현재 그라인더의 별도 변환값을 구분해 안전 탐색 범위를 제시",
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

  const verified = recipe.sourceStatus === "verified";
  const partialSource = recipe.id === jisCleverRecipeId;
  const sourceProcedure = verified || partialSource;
  const order = cleverLoadingOrder(recipe);
  const immersionOffset = input.recommendationOffset?.["immersion-time"] ?? 0;
  const agitationOffset = input.recommendationOffset?.agitation ?? 0;
  const agitationCount = clamp(1 + agitationOffset, 0, 2);
  const timing = cleverTiming(recipe, immersionOffset);
  const temperatureOffset = input.recommendationOffset?.temperature ?? 0;
  const unadjustedFallback = recommendation.temperatureCelsius - temperatureOffset;
  const temperatureBase =
    verified && recipe.temperatureCelsius !== undefined
      ? recipe.temperatureCelsius
      : cleverTemperatureForRoast(input.bean.roastLevel, unadjustedFallback);
  const temperatureCelsius = clamp(
    temperatureBase + temperatureOffset,
    82,
    verified ? 100 : 96,
  );
  const orderLabel = order === "water-first" ? "물 먼저" : "커피 먼저";
  const agitationLabel =
    sourceProcedure && agitationOffset === 0
      ? verified
        ? "공식 교반 구조"
        : "부분 검증 원본 교반 구조"
      : agitationCount === 0
        ? "개인 조정: 교반 생략"
        : `개인 조정: 교반 ${agitationCount}회`;
  const grindRange = cleverGrindRange(recommendation.grinder, input.grinder);
  const steps = recommendation.steps.map((step) => {
    const text = `${step.label} ${step.cue}`;
    if (text.includes("드로다운")) {
      return {
        ...step,
        startSeconds: timing.immersionSeconds,
        cue:
          sourceProcedure && immersionOffset === 0
            ? `${step.cue} 드로다운 ${timing.drawdownMinSeconds}~${timing.drawdownMaxSeconds}초를 별도로 기록하세요.`
            : `${timing.immersionSeconds}초 침출 후 서버에 올리고, 개인 조정 드로다운 ${timing.drawdownMinSeconds}~${timing.drawdownMaxSeconds}초를 별도로 관찰하세요.`,
      };
    }
    if (
      (text.includes("커피") || text.includes("교반") || text.includes("저어")) &&
      (!sourceProcedure || agitationOffset !== 0)
    ) {
      return {
        ...step,
        cue:
          agitationCount === 0
            ? `${step.cue} 개인 조정값으로 이번 추출은 교반을 생략합니다.`
            : `${step.cue} 개인 조정값으로 교반 ${agitationCount}회를 적용합니다.`,
      };
    }
    return step;
  });

  const sourceReasons = verified
    ? [
        `[공식 원본] 1차 출처의 ${temperatureCelsius}℃와 총 추출 ${timing.totalMinSeconds}~${timing.totalMaxSeconds}초를 적용했습니다.`,
      ]
    : partialSource
      ? [
          "[부분 검증 원본] 정인성 바리스타 본인 채널 설명에서 커피 20g·추출수 220g·1:11, 40g 초기 적심, 0:30 본 물, 1:00 재교반, 2:30 배출 시작, 3:20~3:40 완료를 확인했습니다.",
          "[원본과 앱 조정 분리] HOT 후가수 80~100g은 원본 선택값입니다. 물 온도와 그라인더 숫자는 원본 미확인으로 배전도·기기 변환 계층에서 별도 제시합니다.",
        ]
      : [
          `[배전도 온도] ${input.bean.roastLevel} 배전에 맞춰 ${temperatureCelsius}℃를 시작값으로 적용했습니다.`,
        ];

  return {
    ...recommendation,
    temperatureCelsius,
    targetTimeMinSeconds: timing.totalMinSeconds,
    targetTimeMaxSeconds: timing.totalMaxSeconds,
    grinder: {
      ...recommendation.grinder,
      displayRange: grindRange,
      note: `${recommendation.grinder.note} 원본 분쇄 문구와 별개로 ${input.grinder.displayName} 변환 시작값 주변 ${grindRange}를 앱 탐색 범위로 사용합니다.`,
    },
    steps,
    reasons: [
      ...recommendation.reasons,
      `[클레버 구조] ${orderLabel} 투입, ${agitationLabel}, 침출 ${timing.immersionSeconds}초를 분리해 적용했습니다.`,
      `[클레버 드로다운] 배출 ${timing.drawdownMinSeconds}~${timing.drawdownMaxSeconds}초를 별도 평가합니다.`,
      `[클레버 분쇄 변환] ${input.grinder.displayName}의 변환 시작값 주변 ${grindRange}는 원본 레시피 수치가 아닌 앱 변환값입니다.`,
      ...sourceReasons,
    ],
    confidence: verified ? "medium" : "reference",
    confidenceReason: verified
      ? "클레버 공식 유통 제품 페이지와 수치·절차가 일치합니다. 분쇄 시작값은 현재 그라인더에 맞춘 변환값이며 개인 성공 기록이 생기면 그 값을 우선합니다."
      : partialSource
        ? "정인성 바리스타 본인 채널 설명에서 비율과 핵심 시간·교반·후가수를 확인했지만 온도·분쇄 숫자·배전도·맛 방향은 확인되지 않아 partial/reference로 유지합니다."
        : "클레버 전용 분쇄·교반·침출·드로다운 구조를 적용했지만 원본 레시피 수치는 1차 출처 검증 전이므로 참고값입니다. 실제 드로다운과 맛 평가를 기록해 개인 성공값을 우선하세요.",
    appliedRules: replaceRules(recommendation.appliedRules, recipe),
  };
}
