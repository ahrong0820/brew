import {
  createBeanBrewProfile,
  createBrewSession,
  withUpdatedTimestamp,
} from "@/lib/domain/factories";
import { estimateMicronsForSetting } from "@/lib/grinder/micronReference";
import {
  beanBrewProfileStore,
  brewSessionStore,
} from "@/lib/storage/coffeeData";
import type {
  Bean,
  BeanBrewProfile,
  BrewerType,
  GrinderProfile,
  RecipeSnapshot,
  TasteGoal,
} from "@/lib/types/coffee";
import type { BrewRecommendation } from "@/lib/types/recommendation";
import type {
  RecommendationTimerStartDetail,
  TimerBrewStep,
  TimerRecipe,
} from "@/lib/timer/recommendationTimer";

interface PrepareRecommendationBrewInput {
  bean: Bean;
  grinder: GrinderProfile;
  brewerType: BrewerType;
  tasteGoal: TasteGoal;
  recommendation: BrewRecommendation;
}

const brewerLabels: Record<BrewerType, string> = {
  v60: "V60",
  clever: "클레버",
  switch: "하리오 스위치",
  other: "기타 드리퍼",
};

const tasteLabels: Record<TasteGoal, string> = {
  sweet: "단맛 중심",
  bright: "산미·향미 중심",
  balanced: "밸런스 중심",
  body: "바디감 중심",
};

function grinderUnitLabel(grinder: GrinderProfile) {
  if (grinder.displayUnit === "dial") {
    return "다이얼";
  }

  if (grinder.displayUnit === "click") {
    return "클릭";
  }

  return "Step";
}

function numericGrindLevel(recommendation: BrewRecommendation) {
  if (!recommendation.grinder.isNumeric) {
    return undefined;
  }

  const value = Number(recommendation.grinder.displayValue);
  return Number.isFinite(value) ? value : undefined;
}

function buildTimerSteps(recommendation: BrewRecommendation) {
  const lastStart =
    recommendation.steps[recommendation.steps.length - 1]?.startSeconds ?? 0;
  const totalTime = Math.max(
    recommendation.targetTimeMaxSeconds,
    lastStart + 30,
  );
  const steps: TimerBrewStep[] = recommendation.steps.map((step, index) => ({
    label: step.label,
    start: step.startSeconds,
    end: recommendation.steps[index + 1]?.startSeconds ?? totalTime,
    targetWater: step.targetWaterGrams,
    cue: step.cue,
  }));

  return { steps, totalTime };
}

function findBrewProfile(
  beanId: string,
  brewerType: BrewerType,
  grinderProfileId: string,
  tasteGoal: TasteGoal,
) {
  return beanBrewProfileStore.list().find(
    (profile) =>
      profile.beanId === beanId &&
      profile.brewerType === brewerType &&
      profile.grinderProfileId === grinderProfileId &&
      profile.tasteGoal === tasteGoal,
  );
}

function createOrGetBrewProfile(
  input: PrepareRecommendationBrewInput,
  timestamp: string,
): { profile: BeanBrewProfile; created: boolean } {
  const existing = findBrewProfile(
    input.bean.id,
    input.brewerType,
    input.grinder.id,
    input.tasteGoal,
  );

  if (existing) {
    return { profile: existing, created: false };
  }

  return {
    profile: createBeanBrewProfile(
      {
        beanId: input.bean.id,
        brewerType: input.brewerType,
        grinderProfileId: input.grinder.id,
        tasteGoal: input.tasteGoal,
        recommendationOffset: {},
      },
      timestamp,
    ),
    created: true,
  };
}

function buildSnapshot(
  input: PrepareRecommendationBrewInput,
  totalTime: number,
  timerSteps: TimerBrewStep[],
): RecipeSnapshot {
  const grindLevel = numericGrindLevel(input.recommendation);
  const estimatedRepresentativeMicrons =
    grindLevel === undefined
      ? undefined
      : (estimateMicronsForSetting(input.grinder, grindLevel) ?? undefined);

  return {
    sourceTemplateId: `recommendation-${input.brewerType}-${input.tasteGoal}`,
    sourceTemplateName: input.recommendation.templateName,
    brewerType: input.brewerType,
    doseGrams: input.recommendation.doseGrams,
    waterGrams: input.recommendation.waterGrams,
    ratio: input.recommendation.ratio,
    temperatureCelsius: input.recommendation.temperatureCelsius,
    grindLevel,
    grinderDisplayValue: input.recommendation.grinder.isNumeric
      ? `${input.recommendation.grinder.displayValue} ${grinderUnitLabel(input.grinder)} · 범위 ${input.recommendation.grinder.displayRange}`
      : `${input.recommendation.grinder.displayValue} · ${input.recommendation.grinder.displayRange}`,
    grinderProfileId: input.grinder.id,
    grinderModel: input.grinder.model,
    grinderCalibrationLabel: input.grinder.calibrationLabel,
    estimatedRepresentativeMicrons,
    totalTimeSeconds: totalTime,
    targetTimeMinSeconds: input.recommendation.targetTimeMinSeconds,
    targetTimeMaxSeconds: input.recommendation.targetTimeMaxSeconds,
    steps: timerSteps.map((step) => ({
      label: step.label,
      startSeconds: step.start,
      endSeconds: step.end,
      targetWaterGrams: step.targetWater,
      cue: step.cue,
    })),
  };
}

function buildTimerRecipe(
  input: PrepareRecommendationBrewInput,
  sessionId: string,
  snapshot: RecipeSnapshot,
  timerSteps: TimerBrewStep[],
): TimerRecipe {
  const estimatedMicronNote = snapshot.estimatedRepresentativeMicrons
    ? `예상 대표 입도 약 ${snapshot.estimatedRepresentativeMicrons.toLocaleString("ko-KR")}μm`
    : "대표 입도는 실제 유속과 맛으로 확인";

  return {
    id: `recommendation-${sessionId}`,
    name: `${input.bean.name} · ${input.recommendation.templateName}`,
    origin: "원두 맞춤 추천",
    method: brewerLabels[input.brewerType],
    profile: tasteLabels[input.tasteGoal],
    tags: ["맞춤 추천", brewerLabels[input.brewerType], tasteLabels[input.tasteGoal]],
    dose: snapshot.doseGrams,
    water: snapshot.waterGrams,
    ratio: `1:${snapshot.ratio}`,
    temp: `${snapshot.temperatureCelsius}℃`,
    grind: snapshot.grinderDisplayValue,
    totalTime: snapshot.totalTimeSeconds,
    notes: [
      `목표 추출 시간 ${formatSeconds(snapshot.targetTimeMinSeconds)}~${formatSeconds(snapshot.targetTimeMaxSeconds)}`,
      `${input.grinder.displayName} · ${input.grinder.calibrationLabel}`,
      estimatedMicronNote,
      "타이머 시작 시 원두별 추출 기록에 자동 저장됨",
    ],
    steps: timerSteps,
  };
}

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function prepareRecommendationBrew(
  input: PrepareRecommendationBrewInput,
): RecommendationTimerStartDetail {
  const timestamp = new Date().toISOString();
  const { profile, created } = createOrGetBrewProfile(input, timestamp);
  const existingSessions = brewSessionStore.list();
  const isFirstSession = !existingSessions.some(
    (session) => session.profileId === profile.id,
  );
  const { steps, totalTime } = buildTimerSteps(input.recommendation);
  const snapshot = buildSnapshot(input, totalTime, steps);
  const session = createBrewSession(
    {
      beanId: input.bean.id,
      profileId: profile.id,
      tasteGoal: input.tasteGoal,
      recommendationConfidence: input.recommendation.confidence,
      recipeSnapshot: snapshot,
      note: "맞춤 추천에서 타이머 시작 시 자동 생성",
      status: "trial",
    },
    timestamp,
  );

  if (!beanBrewProfileStore.upsert(profile)) {
    throw new Error("추출 프로필을 저장하지 못했습니다.");
  }

  if (!brewSessionStore.upsert(session)) {
    if (created) {
      beanBrewProfileStore.remove(profile.id);
    }
    throw new Error("추출 기록을 저장하지 못했습니다.");
  }

  const nextProfile = withUpdatedTimestamp(
    { ...profile, latestSessionId: session.id },
    timestamp,
  );

  if (!beanBrewProfileStore.upsert(nextProfile)) {
    brewSessionStore.remove(session.id);
    if (created) {
      beanBrewProfileStore.remove(profile.id);
    }
    throw new Error("추출 기록 연결을 저장하지 못했습니다.");
  }

  return {
    recipe: buildTimerRecipe(input, session.id, snapshot, steps),
    sessionId: session.id,
    isFirstSession,
  };
}
