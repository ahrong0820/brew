import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export const verifiedCleverRecipes: readonly BaristaRecipe[] = [
  {
    id: "clever-official-distributor-185",
    name: "클레버 공식 유통 레시피 18.5g",
    author: "Clever Coffee Brewers / Eight Ounce Coffee",
    sourceLabel: "Clever Coffee Brewers 공식 유통 제품 페이지",
    sourceStatus: "reference",
    brewerType: "clever",
    drinkStyle: "hot",
    doseGrams: 18.5,
    supportedDoseGrams: { min: 18, max: 19 },
    waterGrams: 310,
    ratio: 16.75,
    temperatureCelsius: 100,
    targetTimeMinSeconds: 150,
    targetTimeMaxSeconds: 165,
    tasteProfile: { sweet: 4, bright: 3, balanced: 5, body: 4 },
    suitableRoasts: ["light", "medium-light", "medium", "medium-dark"],
    suitableProcesses: ["washed", "natural", "honey", "fermented", "unknown"],
    flavorKeywords: ["단맛", "균형", "클린", "바디", "초콜릿", "카라멜"],
    grindIntent: {
      originalDescription: "공식 페이지는 분쇄 수치를 지정하지 않고 완전 침출 후 배출을 안내",
      targetFlow: "moderate",
    },
    difficulty: "easy",
    steps: [
      {
        label: "물 먼저 붓기",
        startSeconds: 0,
        targetWaterGrams: 310,
        cue: "100℃ 물을 310g까지 먼저 붓기",
      },
      {
        label: "커피 투입·초기 교반",
        startSeconds: 5,
        targetWaterGrams: 310,
        cue: "18.5g 커피를 넣고 마른 덩어리가 없도록 저은 뒤 0:25 이전에 뚜껑 닫기",
      },
      {
        label: "침출",
        startSeconds: 25,
        targetWaterGrams: 310,
        cue: "뚜껑을 닫고 1:10까지 침출하기",
      },
      {
        label: "크러스트 브레이크",
        startSeconds: 70,
        targetWaterGrams: 310,
        cue: "뚜껑을 열고 필터 벽의 커피를 떼어 내며 스푼으로 두 바퀴 저어 주기",
      },
      {
        label: "드로다운",
        startSeconds: 75,
        targetWaterGrams: 310,
        cue: "서버에 올리고 네 번 더 저어 소용돌이를 만든 뒤 2:30~2:45 사이에 배출 완료 확인",
      },
    ],
  },
] as const;
