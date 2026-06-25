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
  const profile = beanBrewProfileStore.list().find(
    (candidate) =>
      candidate.beanId === input.bean.id &&
      candidate.brewerType === input.preferences.defaultBrewer &&
      candidate.grinderProfileId === input.grinder.id &&
      candidate.tasteGoal === input.tasteGoal,
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
      confidence: "high",
      reasons: [
        ...recommendation.reasons,
        `같은 조건에서 좋음 평가가 ${successfulSessions.length}회 누적되어 개인 성공 이력을 우선 반영했습니다.`,
      ],
      confidenceReason:
        "같은 원두·드리퍼·그라인더·맛 방향에서 성공 기록이 2회 이상 재현되어 개인화 신뢰도가 높습니다.",
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
        "현재 베스트 기록이 1회 있습니다. 같은 조건에서 한 번 더 좋은 맛이 재현되면 개인화 신뢰도가 높아집니다.",
    };
  }

  return recommendation;
}
