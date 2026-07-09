import type { Recipe } from "../lib/types/defaultRecipe.ts";

export const clever111 = {
  id: "jis-clever-1-11",
  name: "정인성 클레버 1:11",
  origin: "정인성 공식 2023 업데이트",
  method: "Mr. Clever",
  profile: "1:11 진한 침출과 후가수 밸런스",
  tags: ["클레버", "침출", "국내", "단맛"],
  dose: 20,
  water: 300,
  brewWater: 220,
  bypassWater: { min: 80, max: 100 },
  finalWater: { min: 300, max: 320 },
  ratio: "1:11 / 최종 약 1:15~1:16",
  temp: "공식 최신 설명 미확인",
  grind: "중간보다 살짝 굵게 시작값",
  totalTime: 220,
  notes: ["구버전 1:12를 20g/220g 1:11로 수정", "HOT 후가수 80~100g"],
  steps: [
    { label: "뜸들이기", start: 0, end: 30, targetWater: 40, cue: "40g을 붓고 즉시 고르게 젓기" },
    { label: "본 물 붓기", start: 30, end: 60, targetWater: 220, cue: "180g을 추가해 누적 220g" },
    { label: "2차 교반", start: 60, end: 150, targetWater: 220, cue: "1:00에 다시 젓고 2:30까지 침출" },
    { label: "드로다운", start: 150, end: 220, targetWater: 220, cue: "2:30에 서버에 올리고 3:20~3:40 완료" },
    { label: "농도 조절", start: 220, end: 220, targetWater: 220, displayTargetWater: { min: 300, max: 320 }, displayStepWater: { min: 80, max: 100 }, cue: "뜨거운 물 80~100g 추가" },
  ],
} satisfies Recipe;
