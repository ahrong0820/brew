import type { BaristaRecipe } from "@/lib/types/baristaRecipe";

export const jisCleverRecipes: readonly BaristaRecipe[] = [
  {
    id: "jis-clever-1-11",
    name: "정인성 Clever 1:11",
    author: "정인성",
    sourceLabel: "정인성의 커피생활 공식 YouTube 영상 설명",
    sourceUrl: "https://youtu.be/JWHanqQ5MsQ",
    sourceStatus: "partial",
    brewerType: "clever",
    drinkStyle: "hot",
    doseGrams: 20,
    supportedDoseGrams: { min: 8, max: 40 },
    waterGrams: 220,
    ratio: 11,
    targetTimeMinSeconds: 200,
    targetTimeMaxSeconds: 220,
    tasteProfile: { sweet: 5, bright: 2, balanced: 3, body: 5 },
    suitableRoasts: ["light", "medium-light", "medium", "medium-dark"],
    suitableProcesses: ["washed", "natural", "honey", "fermented", "unknown"],
    flavorKeywords: ["진한 농도", "단맛", "바디", "묵직", "후가수"],
    grindIntent: {
      originalDescription:
        "원본 설명은 분쇄 숫자를 제시하지 않고 3:20~3:40 배출 완료를 목표로 조정을 안내",
      targetFlow: "moderate",
    },
    difficulty: "easy",
    steps: [
      {
        label: "커피 먼저·초기 적심",
        startSeconds: 0,
        targetWaterGrams: 40,
        cue: "커피 20g에 물 40g을 붓고 바로 스푼으로 저어 전체를 적시기",
      },
      {
        label: "본 물 붓기",
        startSeconds: 30,
        targetWaterGrams: 220,
        cue: "물 180g을 추가해 총 추출수 220g 맞추기",
      },
      {
        label: "두 번째 교반",
        startSeconds: 60,
        targetWaterGrams: 220,
        cue: "1:00에 커피층을 스푼으로 한 번 더 저어 주기",
      },
      {
        label: "드로다운",
        startSeconds: 150,
        targetWaterGrams: 220,
        cue: "2:30에 서버에 올려 배출을 시작하고 3:20~3:40 완료를 목표로 분쇄도를 조정",
      },
      {
        label: "HOT 후가수",
        startSeconds: 220,
        targetWaterGrams: 320,
        cue: "원본 선택값: 뜨거운 물 80~100g으로 희석해 최종 300~320g 범위로 맞추기",
      },
    ],
  },
] as const;
