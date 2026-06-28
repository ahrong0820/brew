import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export const additionalBaristaRecipes: readonly BaristaRecipe[] = [
  {
    id: "clever-balanced-reference",
    name: "클레버 균형형 침출 기본 참조",
    author: "Brew 기본 참조",
    sourceLabel: "검증 전 내부 참고 레시피",
    sourceStatus: "reference",
    brewerType: "clever",
    drinkStyle: "hot",
    doseGrams: 15,
    supportedDoseGrams: { min: 12, max: 22 },
    waterGrams: 250,
    ratio: 16.7,
    temperatureCelsius: 94,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 210,
    tasteProfile: {
      sweet: 4,
      bright: 3,
      balanced: 5,
      body: 4,
    },
    suitableRoasts: ["light", "medium-light", "medium", "medium-dark"],
    suitableProcesses: ["washed", "natural", "honey", "fermented", "unknown"],
    flavorKeywords: ["단맛", "균형", "클린", "바디"],
    grindIntent: {
      originalDescription: "중간보다 굵은 분쇄",
      targetFlow: "moderate",
    },
    difficulty: "easy",
    steps: [
      {
        label: "물 붓기",
        startSeconds: 0,
        targetWaterGrams: 250,
        cue: "클레버에 목표 물량을 먼저 붓기",
      },
      {
        label: "커피 투입",
        startSeconds: 5,
        targetWaterGrams: 250,
        cue: "분쇄한 커피를 넣고 마른 가루가 없도록 짧게 저어 주기",
      },
      {
        label: "드로다운",
        startSeconds: 120,
        targetWaterGrams: 250,
        cue: "서버에 올려 배출하고 추출 속도는 빠름·적정·느림으로 평가하기",
      },
    ],
  },
] as const;
