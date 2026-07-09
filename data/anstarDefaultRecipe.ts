import type { Recipe } from "../lib/types/defaultRecipe.ts";

export const anstarDefaultRecipe = {
  id: "anstar-6888",
  name: "안스타 6888",
  origin: "안스타 공식 2024 다인분 레시피 (통칭)",
  method: "V60",
  profile: "굵은 분쇄, 향미 표현, 반복하기 쉬운 6888 펄스",
  tags: ["V60", "국내", "향미"],
  dose: 20,
  water: 300,
  ratio: "1:15",
  temp: "20g 원본 수치 미확인",
  grind: "굵은 분쇄 시작값",
  totalTime: 150,
  notes: [
    "공식 영상은 2·4인분 HOT/ICE 레시피이며 6888은 널리 쓰이는 통칭",
    "60-80-80-80과 시점은 기존 앱 전사 시작값으로 원두에 맞춰 조절",
  ],
  steps: [
    { label: "블루밍", start: 0, end: 30, targetWater: 60, cue: "[앱 시작값] 60g으로 전체를 적시기" },
    { label: "1차 추출", start: 30, end: 60, targetWater: 140, cue: "[앱 시작값] 80g을 추가해 누적 140g" },
    { label: "2차 추출", start: 60, end: 90, targetWater: 220, cue: "[앱 시작값] 같은 속도로 80g 추가" },
    { label: "3차 추출", start: 90, end: 120, targetWater: 300, cue: "[앱 시작값] 마지막 80g을 채워 총 300g" },
    { label: "완료", start: 120, end: 150, targetWater: 300, cue: "2:00~2:30 흐름을 확인하며 드리퍼 제거" },
  ],
} satisfies Recipe;
