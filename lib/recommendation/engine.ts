import { matchesBrewProfileIdentity } from "@/lib/brew/profileIdentity";
import { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";
import {
  beanBrewProfileStore,
  brewSessionStore,
} from "@/lib/storage/coffeeData";
import type {
  BrewRecommendation,
  RecommendationInput,
} from "@/lib/types/recommendation";

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
  const recommendation = createPersonalizedRecommendation({
    ...input,
    recommendationOffset:
      input.recommendationOffset ?? profile?.recommendationOffset,
  });

  if (!profile) {
    return recommendation;
  }

  const successfulSessions = brewSessionStore.list().filter(
    (session) =>
      session.profileId === profile.id &&
      (session.status === "good" ||
        session.status === "current-best" ||
        session.tastingResult === "good"),
  );

  if (successfulSessions.length >= 2) {
    return {
      ...recommendation,
      confidence: "medium",
      reasons: [
        ...recommendation.reasons,
        `같은 조건에서 좋음 평가가 ${successfulSessions.length}회 누적되어 개인 성공 이력을 우선 반영했습니다.`,
      ],
      confidenceReason:
        "같은 원두·음용 방식·드리퍼·그라인더·맛 방향에서 성공 기록이 2회 이상 재현되어 개인화 추천 근거가 강화되었습니다.",
    };
  }

  if (successfulSessions.length === 1) {
    return {
      ...recommendation,
      confidence:
        recommendation.confidence === "reference"
          ? "medium"
          : recommendation.confidence,
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
