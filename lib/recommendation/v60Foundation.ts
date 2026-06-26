import type { RecommendationStep } from "@/lib/types/recommendation";

export const v60FoundationRuleIds = {
  pour: "pour.v60-hot-paper.foundation.v1",
  time: "time.v60-hot-paper.foundation.v1",
} as const;

export const v60FoundationTargetTime = {
  min: 150,
  max: 180,
} as const;

function roundWater(value: number) {
  return Math.round(value / 5) * 5;
}

export function v60FoundationBloomWater(doseGrams: number, waterGrams: number) {
  return Math.min(roundWater(doseGrams * 3), roundWater(waterGrams * 0.25));
}

export function createV60FoundationSteps(
  doseGrams: number,
  waterGrams: number,
): RecommendationStep[] {
  const bloomWater = v60FoundationBloomWater(doseGrams, waterGrams);

  return [
    {
      label: "블루밍",
      startSeconds: 0,
      targetWaterGrams: bloomWater,
      cue: "중심에서 바깥쪽으로 원을 그리며 가루 전체를 적시고 30초까지 기다리기",
    },
    {
      label: "본 추출",
      startSeconds: 30,
      targetWaterGrams: waterGrams,
      cue: "종이 필터에 직접 붓지 않고 중심에서 바깥쪽으로 원을 그리며 천천히 총 물량까지 붓기",
    },
  ];
}
