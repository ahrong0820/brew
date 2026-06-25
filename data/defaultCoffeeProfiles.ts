import type {
  GrinderProfile,
  UserPreferences,
} from "@/lib/types/coffee";

export const defaultGrinderProfileIds = {
  kUltraBurrNoRub: "grinder-k-ultra-burr-no-rub",
  holzklotzE80: "grinder-holzklotz-e80",
  baratzaEncore: "grinder-baratza-encore",
} as const;

export function createDefaultGrinderProfiles(
  timestamp = new Date().toISOString(),
): GrinderProfile[] {
  return [
    {
      id: defaultGrinderProfileIds.kUltraBurrNoRub,
      model: "1zpresso-k-ultra",
      displayName: "1Zpresso K-Ultra",
      calibrationProfile: "burr-no-rub",
      calibrationLabel: "버 비접촉 영점",
      calibrationStatus: "user-calibrated",
      recommendationStatus: "primary",
      displayUnit: "dial",
      adjustmentDirection: "higher-is-coarser",
      displayStep: 0.1,
      personalOffset: 0,
      notes: [
        "버가 스치지 않기 시작하는 최초 지점을 0으로 맞춘 사용자 기준입니다.",
        "공식 영점 수치와 고정 환산하지 않습니다.",
      ],
      isBuiltIn: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: defaultGrinderProfileIds.holzklotzE80,
      model: "holzklotz-e80",
      displayName: "홀츠클로츠 E80",
      calibrationProfile: "manufacturer-step-micron",
      calibrationLabel: "제조사 Step-미크론 기준",
      calibrationStatus: "factory",
      recommendationStatus: "reference",
      displayUnit: "step",
      adjustmentDirection: "higher-is-coarser",
      displayStep: 1,
      personalOffset: 0,
      micronReference: {
        source: "manufacturer",
        sourceLabel: "홀츠클로츠 E80 제조사 제공 Step-미크론 표",
        points: [
          { step: 5, microns: 233 },
          { step: 10, microns: 345 },
          { step: 20, microns: 570 },
          { step: 30, microns: 795 },
          { step: 40, microns: 1020 },
          { step: 50, microns: 1245 },
        ],
        linearFit: {
          slope: 22.49315068,
          intercept: 120.26027397,
        },
      },
      notes: [
        "제조사 자료에서 Step가 커질수록 표기 입도가 굵어집니다.",
        "제조사 기준 범위는 5 Step 233μm부터 50 Step 1,245μm까지입니다.",
        "Step-미크론 관계가 확인되어도 특정 레시피의 목표 Step는 실제 추출 검증이 필요합니다.",
      ],
      isBuiltIn: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: defaultGrinderProfileIds.baratzaEncore,
      model: "baratza-encore",
      displayName: "Baratza Encore",
      calibrationProfile: "factory-reference",
      calibrationLabel: "기본형 Encore 기준",
      calibrationStatus: "factory",
      recommendationStatus: "reference",
      displayUnit: "click",
      adjustmentDirection: "higher-is-coarser",
      displayStep: 1,
      personalOffset: 0,
      notes: [
        "Encore ESP가 아닌 기본형 Encore를 대상으로 합니다.",
        "초기 추천은 시작점과 앞뒤 1~2클릭 범위로 제공합니다.",
      ],
      isBuiltIn: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

export function createDefaultUserPreferences(
  timestamp = new Date().toISOString(),
): UserPreferences {
  return {
    defaultBrewer: "v60",
    defaultDoseGrams: 15,
    defaultWaterGrams: 240,
    defaultDrinkStyle: "hot",
    defaultGrinderProfileId: defaultGrinderProfileIds.kUltraBurrNoRub,
    defaultTasteGoal: "balanced",
    updatedAt: timestamp,
  };
}
