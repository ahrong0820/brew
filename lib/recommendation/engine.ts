import { matchesBrewProfileIdentity } from "@/lib/brew/profileIdentity";
import { applyBaristaRecipeRecommendation } from "@/lib/recommendation/baristaRecipeRecommendation";
import {
  isKUltraOfficialProfile,
  kUltraOfficialRuleId,
} from "@/lib/recommendation/kUltraOfficialRange";
import {
  normalizeRatio,
  normalizeRecommendationForGrinder,
  recommendedRatioForTaste,
} from "@/lib/recommendation/normalization";
import { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";
import {
  appendAppliedRule,
  createAppliedRule,
  personalHistorySourceId,
} from "@/lib/recommendation/ruleEvidence";
import { v60FoundationRuleIds } from "@/lib/recommendation/v60Foundation";
import {
  applyV60FoundationRecommendation,
  appliesV60HotPaperFoundation,
} from "@/lib/recommendation/v60FoundationRecommendation";
import {
  appliesV60FoundationRatio,
  v60FoundationRatio,
  v60FoundationRatioRuleId,
} from "@/lib/recommendation/v60FoundationRatio";
import {
  appliesV60ReferenceGrind,
  v60ReferenceGrindRuleId,
} from "@/lib/recommendation/v60ReferenceGrind";
import {
  appliesV60RoastOnlyTemperature,
  v60RoastOnlyTemperatureRuleId,
} from "@/lib/recommendation/v60RoastOnlyTemperature";
import {
  beanBrewProfileStore,
  brewSessionStore,
} from "@/lib/storage/coffeeData";
import type {
  AppliedRecommendationRule,
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

function baseAppliedRules(input: RecommendationInput) {
  const brewer = input.preferences.defaultBrewer;
  const usesV60Foundation = appliesV60HotPaperFoundation(input);
  const usesV60Ratio = appliesV60FoundationRatio(input);
  const usesV60Temperature = appliesV60RoastOnlyTemperature(input);
  const usesV60ReferenceGrind = appliesV60ReferenceGrind(input);
  const usesKUltraOfficialRange =
    isKUltraOfficialProfile(input.grinder) &&
    brewer === "v60" &&
    input.preferences.defaultDrinkStyle === "hot";
  const grinderEvidence =
    input.grinder.model === "holzklotz-e80"
      ? {
          evidenceKind: "manufacturer" as const,
          sourceId: "manufacturer:holzklotz-e80-micron-reference",
        }
      : {};
  const grinderRuleId = usesKUltraOfficialRange
    ? kUltraOfficialRuleId
    : usesV60ReferenceGrind
      ? v60ReferenceGrindRuleId
      : `grind.${input.grinder.model}.v1`;
  const ratioRuleId = usesV60Ratio
    ? v60FoundationRatioRuleId
    : "ratio.taste-goal.v1";
  const temperatureRuleId = usesV60Temperature
    ? v60RoastOnlyTemperatureRuleId
    : "temperature.roast-process-taste.v1";

  return [
    createAppliedRule({
      id: "dose.user-default.normalized.v1",
      parameter: "dose",
      description: "사용자 기본 원두량을 지원 범위와 1g 단위로 정규화",
    }),
    createAppliedRule({
      id: ratioRuleId,
      parameter: "ratio",
      description: usesV60Ratio
        ? "HOT V60에서 1:16 공통 시작점 적용"
        : "맛 목표별 초기 추출 비율 적용",
    }),
    createAppliedRule({
      id: "water.dose-ratio.normalized.v1",
      parameter: "water",
      description: "정규화된 원두량과 비율로 물량을 계산하고 5g 단위로 반올림",
    }),
    createAppliedRule({
      id: temperatureRuleId,
      parameter: "temperature",
      description: usesV60Temperature
        ? "HOT V60에서 배전도 기준 온도만 적용"
        : "배전도·가공 방식·맛 목표의 초기 온도 오프셋 적용",
    }),
    createAppliedRule({
      id: grinderRuleId,
      parameter: "grind",
      description: usesKUltraOfficialRange
        ? "K-Ultra 공식 저항 시작 영점과 Pour Over 8.0~9.0 범위 적용"
        : usesV60ReferenceGrind
          ? "HOT V60에서 모델별 기존 기준점을 유지하고 원두 속성별 미검증 분쇄도 오프셋 제외"
          : "그라인더 모델과 영점 기준의 초기 분쇄도 및 지원 범위 적용",
      ...grinderEvidence,
    }),
    createAppliedRule({
      id: usesV60Foundation
        ? v60FoundationRuleIds.pour
        : `pour.${brewer}.${input.tasteGoal}.v1`,
      parameter: "pour",
      description: usesV60Foundation
        ? "HOT V60 종이필터에 30초 블루밍과 원형 본 주입 적용"
        : "드리퍼와 맛 목표별 푸어 단계 및 누적 물량 적용",
    }),
    createAppliedRule({
      id: usesV60Foundation
        ? v60FoundationRuleIds.time
        : `time.${brewer}.v1`,
      parameter: "time",
      description: usesV60Foundation
        ? "HOT V60 종이필터 목표 시간을 2분 30초~3분으로 적용"
        : "드리퍼 유형별 목표 추출 시간 범위 적용",
    }),
  ];
}

function appendPersonalOffsetRule(
  rules: AppliedRecommendationRule[],
  input: RecommendationInput,
) {
  const offset = input.recommendationOffset;
  const hasOffset =
    (offset?.temperature ?? 0) !== 0 ||
    (offset?.ratio ?? 0) !== 0 ||
    (offset?.grind ?? 0) !== 0;
  if (!hasOffset) return rules;
  return appendAppliedRule(
    rules,
    createAppliedRule({
      id: "personalization.profile-offset.v1",
      parameter: "personalization",
      description: "동일 조건의 사용자 추출 기록에서 저장한 보정값 적용",
      evidenceKind: "personal",
      sourceId: personalHistorySourceId,
    }),
  );
}

export function createRecommendation(
  input: RecommendationInput,
): BrewRecommendation {
  const profile = beanBrewProfileStore.list().find((candidate) =>
    matchesBrewProfileIdentity(candidate, {
      beanId: input.bean.id,
      brewerType: input.preferences.defaultBrewer,
      grinderProfileId: input.grinder.id,
      tasteGoal: input.tasteGoal,
      drinkStyle: input.preferences.defaultDrinkStyle,
    }),
  );
  const recommendationOffset =
    input.recommendationOffset ?? profile?.recommendationOffset;
  const recommendationInput = { ...input, recommendationOffset };
  const generated = createPersonalizedRecommendation(recommendationInput);
  const initialRatio = appliesV60FoundationRatio(input)
    ? v60FoundationRatio
    : recommendedRatioForTaste(input.tasteGoal);
  const canonicalRatio = normalizeRatio(
    initialRatio + (recommendationOffset?.ratio ?? 0),
  );
  let recommendation = normalizeRecommendationForGrinder(
    {
      ...generated,
      ratio: canonicalRatio,
      appliedRules: appendPersonalOffsetRule(
        baseAppliedRules(input),
        recommendationInput,
      ),
    },
    input.grinder,
    { deriveWaterFromRatio: true },
  );

  recommendation = applyV60FoundationRecommendation(
    recommendation,
    recommendationInput,
  );
  recommendation = applyBaristaRecipeRecommendation(
    recommendation,
    recommendationInput,
  );
  if (!profile) return recommendation;

  const successfulSessions = brewSessionStore.list().filter(
    (session) =>
      session.profileId === profile.id &&
      (session.status === "good" ||
        session.status === "current-best" ||
        session.tastingResult === "good"),
  );

  if (successfulSessions.length >= 2) {
    recommendation = {
      ...recommendation,
      confidence: "medium",
      appliedRules: appendAppliedRule(
        recommendation.appliedRules ?? [],
        createAppliedRule({
          id: "personalization.success-history.repeat.v1",
          parameter: "confidence",
          description: "동일 조건의 좋은 평가가 2회 이상 반복된 이력 반영",
          evidenceKind: "personal",
          sourceId: personalHistorySourceId,
        }),
      ),
      reasons: [
        ...recommendation.reasons,
        `같은 조건에서 좋음 평가가 ${successfulSessions.length}회 누적되어 개인 성공 이력을 우선 반영했습니다.`,
      ],
      confidenceReason:
        "같은 조건에서 성공 기록이 2회 이상 재현되어 개인화 추천 근거가 강화되었습니다.",
    };
  } else if (successfulSessions.length === 1) {
    recommendation = {
      ...recommendation,
      confidence:
        recommendation.confidence === "reference"
          ? "medium"
          : recommendation.confidence,
      appliedRules: appendAppliedRule(
        recommendation.appliedRules ?? [],
        createAppliedRule({
          id: "personalization.success-history.single.v1",
          parameter: "confidence",
          description: "동일 조건의 현재 베스트 1회 이력 반영",
          evidenceKind: "personal",
          sourceId: personalHistorySourceId,
        }),
      ),
      reasons: [
        ...recommendation.reasons,
        "같은 조건의 현재 베스트 추출 1회를 참고했습니다.",
      ],
      confidenceReason:
        "현재 베스트 기록이 1회 있습니다. 같은 조건에서 한 번 더 좋은 맛이 재현되면 기록 신뢰도가 높아집니다.",
    };
  }
  return recommendation;
}
