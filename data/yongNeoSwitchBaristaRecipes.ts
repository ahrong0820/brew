import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

const commonSuitableRoasts = ["light", "medium-light"] as const;
const commonSuitableProcesses = ["washed", "natural", "honey", "fermented", "unknown"] as const;

export const yongNeoSwitchBaristaRecipes: readonly BaristaRecipe[] = [
  {
    id: "yong-neo-reverse-switch-hot",
    name: "용챔 15g 네오스위치 HOT",
    author: "용챔",
    sourceLabel: "용챔 공식 YouTube 네오스위치 HOT 15g 레시피",
    sourceUrl: "https://www.youtube.com/watch?v=8JD__5hwN0M",
    sourceStatus: "verified",
    brewerType: "switch",
    drinkStyle: "hot",
    doseGrams: 15,
    supportedDoseGrams: { min: 12, max: 18 },
    waterGrams: 230,
    ratio: 15.2,
    temperatureCelsius: 92,
    targetTimeMinSeconds: 210,
    targetTimeMaxSeconds: 240,
    tasteProfile: {
      sweet: 4,
      bright: 4,
      balanced: 5,
      body: 4,
    },
    suitableRoasts: commonSuitableRoasts,
    suitableProcesses: commonSuitableProcesses,
    flavorKeywords: ["라이트", "선명", "향미", "밸런스", "침출"],
    grindIntent: {
      originalDescription:
        "EK43 12 / 코만단테 26클릭 / K-Ultra·Ode2는 따뜻한 기준보다 0.5~1 더 곱게",
      targetFlow: "moderate",
    },
    difficulty: "advanced",
    steps: [
      {
        label: "물 선투입",
        startSeconds: 0,
        targetWaterGrams: 30,
        cue: "스위치를 닫고 물 30g까지 푸어링",
      },
      {
        label: "커피 투입 · 영점",
        startSeconds: 30,
        targetWaterGrams: 30,
        cue: "커피 15g을 담고 스케일을 영점 처리",
      },
      {
        label: "2차 푸어",
        startSeconds: 60,
        targetWaterGrams: 60,
        cue: "스케일 표시 30g까지 푸어링. 실제 누적 물량은 60g",
      },
      {
        label: "10초 배출",
        startSeconds: 90,
        targetWaterGrams: 60,
        cue: "1:30부터 1:40까지 스위치를 열어 배출",
      },
      {
        label: "3차 푸어",
        startSeconds: 100,
        targetWaterGrams: 170,
        cue: "스케일 표시 140g까지 푸어링. 실제 누적 물량은 170g",
      },
      {
        label: "스위치 닫고 4차 푸어",
        startSeconds: 150,
        targetWaterGrams: 230,
        cue: "스위치를 닫고 스케일 표시 200g까지 푸어링. 실제 총량은 230g",
      },
      {
        label: "최종 오픈",
        startSeconds: 160,
        targetWaterGrams: 230,
        cue: "2:40에 스위치를 열어 3:30~4:00까지 커피액을 받기. 기호에 따라 물 10g 희석",
      },
    ],
  },
  {
    id: "yong-neo-reverse-switch-ice",
    name: "용챔 15g 네오스위치 ICE",
    author: "용챔",
    sourceLabel: "용챔 공식 YouTube 네오스위치 ICE 15g 레시피",
    sourceUrl: "https://www.youtube.com/watch?v=h_Y2D7Fppgw",
    sourceStatus: "verified",
    brewerType: "switch",
    drinkStyle: "iced",
    doseGrams: 15,
    supportedDoseGrams: { min: 12, max: 18 },
    waterGrams: 150,
    ratio: 10,
    temperatureCelsius: 92,
    targetTimeMinSeconds: 195,
    targetTimeMaxSeconds: 210,
    tasteProfile: {
      sweet: 3,
      bright: 5,
      balanced: 4,
      body: 4,
    },
    suitableRoasts: commonSuitableRoasts,
    suitableProcesses: commonSuitableProcesses,
    flavorKeywords: ["아이스", "산뜻", "선명", "향미", "침출"],
    grindIntent: {
      originalDescription:
        "EK43 11.5 / 코만단테 25클릭 / K-Ultra·Ode2는 따뜻한 기준보다 0.5~1 더 곱게",
      targetFlow: "moderate",
    },
    difficulty: "advanced",
    steps: [
      {
        label: "물 선투입",
        startSeconds: 0,
        targetWaterGrams: 30,
        cue: "스위치를 닫고 물 30g까지 푸어링",
      },
      {
        label: "커피 투입 · 영점",
        startSeconds: 30,
        targetWaterGrams: 30,
        cue: "커피 15g을 담고 스케일을 영점 처리",
      },
      {
        label: "2차 푸어",
        startSeconds: 60,
        targetWaterGrams: 60,
        cue: "스케일 표시 30g까지 푸어링. 실제 누적 물량은 60g",
      },
      {
        label: "10초 배출",
        startSeconds: 90,
        targetWaterGrams: 60,
        cue: "1:30부터 1:40까지 스위치를 열어 배출",
      },
      {
        label: "3차 푸어",
        startSeconds: 100,
        targetWaterGrams: 120,
        cue: "스케일 표시 90g까지 푸어링. 실제 누적 물량은 120g",
      },
      {
        label: "스위치 올리고 4차 푸어",
        startSeconds: 135,
        targetWaterGrams: 150,
        cue: "2:15에 스위치를 올리고 스케일 표시 120g까지 푸어링. 실제 총량은 150g",
      },
      {
        label: "스위치 내림",
        startSeconds: 150,
        targetWaterGrams: 150,
        cue: "2:30에 스위치를 내려주고 3:15~3:30까지 커피액을 받기",
      },
    ],
  },
] as const;
