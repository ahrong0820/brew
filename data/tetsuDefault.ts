export const tetsuDefault = {
  id: "tetsu-neo-2026",
  name: "테츠 카스야 THE NEO BREW 2026",
  origin: "Tetsu Kasuya",
  method: "V60",
  profile: "극굵은 분쇄, 15초 간격 10회 푸어, 높은 단맛과 점성",
  tags: ["V60", "라이트", "단맛"],
  dose: 20,
  water: 300,
  ratio: "1:15",
  temp: "95~96℃",
  grind: "C40 40~45클릭 / 극굵은 분쇄",
  totalTime: 180,
  notes: ["30g씩 15초 간격으로 총 10회 푸어", "HARIO NEO 권장, V60에서도 사용 가능"],
  steps: Array.from({ length: 10 }, (_, index) => ({
    label: String(index + 1) + "차 푸어",
    start: index * 15,
    end: index === 9 ? 180 : (index + 1) * 15,
    targetWater: (index + 1) * 30,
    cue: index === 9
      ? "2:15에 누적 300g. 빠른 배출을 유지하며 최종 드로다운 확인"
      : "30g을 붓고 드리퍼 안에 물이 오래 머물지 않게 빠르게 배출",
  })),
};
