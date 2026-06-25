import type {
  BrewerType,
  ProcessMethod,
  RoastLevel,
  TasteGoal,
} from "@/lib/types/coffee";
import type {
  BrewRecommendation,
  GrinderRecommendation,
  RecommendationInput,
  RecommendationStep,
} from "@/lib/types/recommendation";

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 94,
  "medium-light": 92,
  medium: 90,
  "medium-dark": 88,
  dark: 85,
  unknown: 91,
};

const ratioByTaste: Record<TasteGoal, number> = {
  sweet: 15.5,
  bright: 16.5,
  balanced: 16,
  body: 15,
};

const temperatureTasteOffset: Record<TasteGoal, number> = {
  sweet: 0,
  bright: 1,
  balanced: 0,
  body: -1,
};

const temperatureProcessOffset: Record<ProcessMethod, number> = {
  washed: 0,
  natural: -1,
  honey: 0,
  fermented: -2,
  unknown: 0,
};

const kUltraRoastOffset: Record<RoastLevel, number> = {
  light: -0.2,
  "medium-light": 0,
  medium: 0.2,
  "medium-dark": 0.4,
  dark: 0.5,
  unknown: 0.1,
};

const kUltraProcessOffset: Record<ProcessMethod, number> = {
  washed: 0,
  natural: 0.1,
  honey: 0.05,
  fermented: 0.2,
  unknown: 0,
};

const kUltraTasteOffset: Record<TasteGoal, number> = {
  sweet: -0.1,
  bright: 0.1,
  balanced: 0,
  body: -0.1,
};

const encoreRoastOffset: Record<RoastLevel, number> = {
  light: -2,
  "medium-light": 0,
  medium: 2,
  "medium-dark": 4,
  dark: 5,
  unknown: 1,
};

const encoreProcessOffset: Record<ProcessMethod, number> = {
  washed: 0,
  natural: 1,
  honey: 0,
  fermented: 2,
  unknown: 0,
};

const encoreTasteOffset: Record<TasteGoal, number> = {
  sweet: -1,
  bright: 1,
  balanced: 0,
  body: -1,
};

const brewerTemplateNames: Record<BrewerType, Record<TasteGoal, string>> = {
  v60: {
    sweet: "V60 단맛 중심 4회 푸어",
    bright: "V60 향미 중심 3회 푸어",
    balanced: "V60 밸런스형 4회 푸어",
    body: "V60 바디 중심 짧은 비율",
  },
  clever: {
    sweet: "클레버 단맛 중심 침출",
    bright: "클레버 클린컵 침출",
    balanced: "클레버 균형형 침출",
    body: "클레버 바디 중심 침출",
  },
  switch: {
    sweet: "스위치 단맛 중심 혼합식",
    bright: "스위치 향미 중심 혼합식",
    balanced: "스위치 균형형 혼합식",
    body: "스위치 바디 중심 침출",
  },
  other: {
    sweet: "범용 단맛 중심 시작점",
    bright: "범용 향미 중심 시작점",
    balanced: "범용 균형형 시작점",
    body: "범용 바디 중심 시작점",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function roundWater(value: number) {
  return Math.round(value / 5) * 5;
}

function commonGrindDescription(brewer: BrewerType, tasteGoal: TasteGoal) {
  if (brewer === "clever") {
    return tasteGoal === "bright" ? "중간보다 약간 굵게" : "중간보다 굵게";
  }

  if (brewer === "switch") {
    return tasteGoal === "body" ? "중간 분쇄" : "중간보다 약간 굵게";
  }

  if (tasteGoal === "bright") {
    return "중간보다 약간 굵게";
  }

  if (tasteGoal === "body" || tasteGoal === "sweet") {
    return "중간 분쇄";
  }

  return "중간~중간보다 약간 굵게";
}

function doseOffset(doseGrams: number) {
  if (doseGrams >= 19) {
    return 0.1;
  }

  if (doseGrams <= 12) {
    return -0.1;
  }

  return 0;
}

function kUltraRecommendation(input: RecommendationInput): GrinderRecommendation {
  const brewerBase: Record<BrewerType, number> = {
    v60: 7,
    clever: 7.5,
    switch: 7.3,
    other: 7.2,
  };

  const rawValue =
    brewerBase[input.preferences.defaultBrewer] +
    kUltraRoastOffset[input.bean.roastLevel] +
    kUltraProcessOffset[input.bean.process] +
    kUltraTasteOffset[input.tasteGoal] +
    doseOffset(input.preferences.defaultDoseGrams) +
    input.grinder.personalOffset;
  const value = clamp(roundTo(rawValue, 0.1), 5.5, 8.5);
  const min = roundTo(value - 0.2, 0.1);
  const max = roundTo(value + 0.2, 0.1);

  return {
    displayValue: value.toFixed(1),
    displayRange: `${min.toFixed(1)}~${max.toFixed(1)}`,
    commonDescription: commonGrindDescription(
      input.preferences.defaultBrewer,
      input.tasteGoal,
    ),
    calibrationLabel: input.grinder.calibrationLabel,
    isNumeric: true,
    note: "사용자 버 비접촉 영점 기준의 첫 추출값입니다. 목표 시간보다 빠르면 0.1~0.2 곱게, 느리고 텁텁하면 0.1~0.2 굵게 조정하세요.",
  };
}

function encoreRecommendation(input: RecommendationInput): GrinderRecommendation {
  const brewerBase: Record<BrewerType, number> = {
    v60: 18,
    clever: 22,
    switch: 20,
    other: 20,
  };

  const rawValue =
    brewerBase[input.preferences.defaultBrewer] +
    encoreRoastOffset[input.bean.roastLevel] +
    encoreProcessOffset[input.bean.process] +
    encoreTasteOffset[input.tasteGoal] +
    (input.preferences.defaultDoseGrams >= 19 ? 1 : 0) +
    input.grinder.personalOffset;
  const value = clamp(Math.round(rawValue), 8, 32);

  return {
    displayValue: String(value),
    displayRange: `${value - 2}~${value + 2}`,
    commonDescription: commonGrindDescription(
      input.preferences.defaultBrewer,
      input.tasteGoal,
    ),
    calibrationLabel: input.grinder.calibrationLabel,
    isNumeric: true,
    note: "기본형 Baratza Encore의 범위형 참고값입니다. 기기 편차를 고려해 실제 유속에 따라 1~2클릭씩 조정하세요.",
  };
}

function referenceRecommendation(input: RecommendationInput): GrinderRecommendation {
  return {
    displayValue: "보정 필요",
    displayRange: "숫자 추천 준비 중",
    commonDescription: commonGrindDescription(
      input.preferences.defaultBrewer,
      input.tasteGoal,
    ),
    calibrationLabel: input.grinder.calibrationLabel,
    isNumeric: false,
    note: "검증된 다이얼 기준점이 없어 숫자를 임의로 만들지 않습니다. 현재는 공통 분쇄도 설명만 제공합니다.",
  };
}

function grinderRecommendation(input: RecommendationInput) {
  if (input.grinder.model === "1zpresso-k-ultra") {
    return kUltraRecommendation(input);
  }

  if (input.grinder.model === "baratza-encore") {
    return encoreRecommendation(input);
  }

  return referenceRecommendation(input);
}

function v60Steps(dose: number, water: number, tasteGoal: TasteGoal) {
  const bloom = Math.min(roundWater(dose * 2.7), roundWater(water * 0.25));
  const pourCount = tasteGoal === "bright" ? 3 : 4;
  const remainingPours = pourCount - 1;
  const remaining = water - bloom;
  const steps: RecommendationStep[] = [
    {
      label: "블루밍",
      startSeconds: 0,
      targetWaterGrams: bloom,
      cue: "가루 전체를 고르게 적시고 40초까지 기다리기",
    },
  ];

  for (let index = 1; index <= remainingPours; index += 1) {
    const target =
      index === remainingPours
        ? water
        : roundWater(bloom + (remaining * index) / remainingPours);
    steps.push({
      label: `${index}차 추출`,
      startSeconds: 40 + (index - 1) * 35,
      targetWaterGrams: target,
      cue:
        tasteGoal === "bright"
          ? "낮은 교반으로 부드럽고 일정하게 붓기"
          : "수위를 안정적으로 유지하며 원을 그려 붓기",
    });
  }

  return steps;
}

function immersionSteps(water: number, brewer: BrewerType) {
  return [
    {
      label: "물 붓기",
      startSeconds: 0,
      targetWaterGrams: water,
      cue: "전체 물을 고르게 붓고 가루가 충분히 젖었는지 확인",
    },
    {
      label: "침출",
      startSeconds: 30,
      targetWaterGrams: water,
      cue: "과도한 교반 없이 침출 유지",
    },
    {
      label: brewer === "switch" ? "스위치 열기" : "드로다운",
      startSeconds: 120,
      targetWaterGrams: water,
      cue: "밸브를 열거나 서버 위에 올려 추출 마무리",
    },
  ];
}

function recommendationSteps(input: RecommendationInput) {
  const { defaultBrewer, defaultDoseGrams, defaultWaterGrams } =
    input.preferences;

  if (defaultBrewer === "v60" || defaultBrewer === "other") {
    return v60Steps(defaultDoseGrams, defaultWaterGrams, input.tasteGoal);
  }

  return immersionSteps(defaultWaterGrams, defaultBrewer);
}

function targetTime(brewer: BrewerType) {
  if (brewer === "clever" || brewer === "switch") {
    return { min: 150, max: 210 };
  }

  return { min: 150, max: 195 };
}

function recommendationReasons(input: RecommendationInput, ratio: number) {
  const reasons = [
    `${input.bean.name}의 ${input.bean.roastLevel === "unknown" ? "미확인 배전도" : "배전도"}를 기준으로 물 온도를 설정했습니다.`,
    `${input.tasteGoal === "balanced" ? "밸런스" : input.tasteGoal === "sweet" ? "단맛" : input.tasteGoal === "bright" ? "산미·향미" : "바디감"} 목표에 맞춰 1:${ratio} 비율을 적용했습니다.`,
  ];

  if (input.bean.process === "natural" || input.bean.process === "fermented") {
    reasons.push("가공 향의 과도한 추출을 줄이도록 온도와 분쇄도를 보수적으로 조정했습니다.");
  }

  return reasons;
}

export function createRecommendation(
  input: RecommendationInput,
): BrewRecommendation {
  const ratio = ratioByTaste[input.tasteGoal];
  const temperature = clamp(
    temperatureByRoast[input.bean.roastLevel] +
      temperatureTasteOffset[input.tasteGoal] +
      temperatureProcessOffset[input.bean.process],
    82,
    96,
  );
  const times = targetTime(input.preferences.defaultBrewer);
  const completeBeanInfo =
    input.bean.roastLevel !== "unknown" && input.bean.process !== "unknown";
  const primaryGrinder = input.grinder.recommendationStatus === "primary";
  const confidence =
    primaryGrinder && completeBeanInfo ? "medium" : "reference";

  return {
    templateName:
      brewerTemplateNames[input.preferences.defaultBrewer][input.tasteGoal],
    doseGrams: input.preferences.defaultDoseGrams,
    waterGrams: input.preferences.defaultWaterGrams,
    ratio,
    temperatureCelsius: temperature,
    targetTimeMinSeconds: times.min,
    targetTimeMaxSeconds: times.max,
    grinder: grinderRecommendation(input),
    steps: recommendationSteps(input),
    reasons: recommendationReasons(input, ratio),
    confidence,
    confidenceReason:
      confidence === "medium"
        ? "동일 그라인더 영점과 입력된 배전도·가공 방식에 초기 규칙을 적용했습니다. 실제 성공 기록은 아직 반영되지 않았습니다."
        : "일부 원두 정보 또는 그라인더 변환 데이터가 부족해 참고 시작점으로 제공합니다.",
  };
}
