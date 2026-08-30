import type { Recipe } from "../lib/types/defaultRecipe.ts";

const tetsuNeoPourStarts = [0, 30, 45, 60, 75, 90, 105, 120, 135, 150] as const;

export const tetsuDefault = {
  id: "tetsu-neo-2026",
  name: "테츠 카스야 THE NEO BREW 2026",
  origin: "Tetsu Kasuya",
  method: "V60",
  profile: "극굵은 분쇄, 30초 블룸 후 15초 간격 10회 푸어, 높은 단맛과 점성",
  tags: ["V60", "라이트", "단맛"],
  dose: 20,
  water: 300,
  ratio: "1:15",
  temp: "95~96℃",
  grind: "C40 40~45클릭 / 극굵은 분쇄",
  totalTime: 210,
  notes: [
    "0:00에 30g을 붓고 0:30까지 뜸들이기",
    "이후 30g씩 15초 간격으로 2:30까지 총 10회 푸어",
    "HARIO NEO 권장, V60에서도 사용 가능",
  ],
  steps: tetsuNeoPourStarts.map((start, index) => ({
    label: index === 0 ? "1차 푸어 · 뜸들이기" : String(index + 1) + "차 푸어",
    start,
    end: tetsuNeoPourStarts[index + 1] ?? 210,
    targetWater: (index + 1) * 30,
    cue:
      index === 0
        ? "30g을 붓고 0:30까지 뜸들이기"
        : index === tetsuNeoPourStarts.length - 1
          ? "2:30에 누적 300g. 빠른 배출을 유지하며 3:30 전후 드로다운 확인"
          : "30g을 추가하고 드리퍼 안에 물이 오래 머물지 않게 빠르게 배출",
  })),
} satisfies Recipe;
