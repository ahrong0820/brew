import { readFile, writeFile } from "node:fs/promises";

async function patch(path, replacements) {
  let source = await readFile(path, "utf8");

  for (const [label, search, replacement] of replacements) {
    const matches = source.split(search).length - 1;
    if (matches !== 1) {
      throw new Error(`${path} ${label}: expected one match, found ${matches}`);
    }
    source = source.replace(search, replacement);
  }

  await writeFile(path, source);
}

await patch("lib/recommendation/baseEngine.ts", [
  [
    "normalization imports",
    `} from "@/lib/types/coffee";\nimport type {`,
    `} from "@/lib/types/coffee";\nimport {\n  grinderDisplayRange,\n  normalizeGrinderSetting,\n  normalizeRecommendation,\n  normalizeTemperatureCelsius,\n  recommendedRatioForTaste,\n  roundWaterGrams,\n} from "@/lib/recommendation/normalization";\nimport { createAppliedRule } from "@/lib/recommendation/ruleEvidence";\nimport type {`,
  ],
  [
    "duplicate ratio table",
    `const ratioByTaste: Record<TasteGoal, number> = {\n  sweet: 15.5,\n  bright: 16.5,\n  balanced: 16,\n  body: 15,\n};\n\n`,
    ``,
  ],
  [
    "duplicate numeric helpers",
    `function clamp(value: number, min: number, max: number) {\n  return Math.min(max, Math.max(min, value));\n}\n\nfunction roundTo(value: number, step: number) {\n  return Math.round(value / step) * step;\n}\n\nfunction roundWater(value: number) {\n  return Math.round(value / 5) * 5;\n}\n\n`,
    ``,
  ],
  [
    "k ultra bounds",
    `  const value = clamp(roundTo(rawValue, 0.1), 5.5, 8.5);\n  const min = roundTo(value - 0.2, 0.1);\n  const max = roundTo(value + 0.2, 0.1);`,
    `  const value = normalizeGrinderSetting(rawValue, input.grinder);\n  const { min, max } = grinderDisplayRange(value, 0.2, input.grinder);`,
  ],
  [
    "encore bounds",
    `  const value = clamp(Math.round(rawValue), 8, 32);`,
    `  const value = normalizeGrinderSetting(rawValue, input.grinder);\n  const range = grinderDisplayRange(value, 2, input.grinder);`,
  ],
  [
    "encore range",
    `    displayRange: \`${"${value - 2}~${value + 2}"}\`,`,
    `    displayRange: \`${"${Math.round(range.min)}~${Math.round(range.max)}"}\`,`,
  ],
  [
    "bloom water rounding",
    `  const bloom = Math.min(roundWater(dose * 2.7), roundWater(water * 0.25));`,
    `  const bloom = Math.min(\n    roundWaterGrams(dose * 2.7),\n    roundWaterGrams(water * 0.25),\n  );`,
  ],
  [
    "pour water rounding",
    `        : roundWater(bloom + (remaining * index) / remainingPours);`,
    `        : roundWaterGrams(bloom + (remaining * index) / remainingPours);`,
  ],
  [
    "canonical recommendation output",
    `export function createRecommendation(\n  input: RecommendationInput,\n): BrewRecommendation {\n  const ratio = ratioByTaste[input.tasteGoal];\n  const temperature = clamp(\n    temperatureByRoast[input.bean.roastLevel] +\n      temperatureTasteOffset[input.tasteGoal] +\n      temperatureProcessOffset[input.bean.process],\n    82,\n    96,\n  );\n  const times = targetTime(input.preferences.defaultBrewer);\n  const completeBeanInfo =\n    input.bean.roastLevel !== "unknown" && input.bean.process !== "unknown";\n  const primaryGrinder = input.grinder.recommendationStatus === "primary";\n  const confidence =\n    primaryGrinder && completeBeanInfo ? "medium" : "reference";\n\n  return {\n    templateName:\n      brewerTemplateNames[input.preferences.defaultBrewer][input.tasteGoal],\n    doseGrams: input.preferences.defaultDoseGrams,\n    waterGrams: input.preferences.defaultWaterGrams,\n    ratio,\n    temperatureCelsius: temperature,\n    targetTimeMinSeconds: times.min,\n    targetTimeMaxSeconds: times.max,\n    grinder: grinderRecommendation(input),\n    steps: recommendationSteps(input),\n    reasons: recommendationReasons(input, ratio),\n    confidence,\n    confidenceReason:\n      confidence === "medium"\n        ? "동일 그라인더 영점과 입력된 배전도·가공 방식에 초기 규칙을 적용했습니다. 실제 성공 기록은 아직 반영되지 않았습니다."\n        : "일부 원두 정보 또는 그라인더별 목표 분쇄 기준이 부족해 참고 시작점으로 제공합니다.",\n  };\n}`,
    `export function createRecommendation(\n  input: RecommendationInput,\n): BrewRecommendation {\n  const ratio = recommendedRatioForTaste(input.tasteGoal);\n  const temperature = normalizeTemperatureCelsius(\n    temperatureByRoast[input.bean.roastLevel] +\n      temperatureTasteOffset[input.tasteGoal] +\n      temperatureProcessOffset[input.bean.process],\n  );\n  const times = targetTime(input.preferences.defaultBrewer);\n  const completeBeanInfo =\n    input.bean.roastLevel !== "unknown" && input.bean.process !== "unknown";\n  const primaryGrinder = input.grinder.recommendationStatus === "primary";\n  const confidence =\n    primaryGrinder && completeBeanInfo ? "medium" : "reference";\n  const brewer = input.preferences.defaultBrewer;\n\n  return normalizeRecommendation({\n    templateName: brewerTemplateNames[brewer][input.tasteGoal],\n    doseGrams: input.preferences.defaultDoseGrams,\n    waterGrams: input.preferences.defaultWaterGrams,\n    ratio,\n    temperatureCelsius: temperature,\n    targetTimeMinSeconds: times.min,\n    targetTimeMaxSeconds: times.max,\n    grinder: grinderRecommendation(input),\n    steps: recommendationSteps(input),\n    reasons: recommendationReasons(input, ratio),\n    confidence,\n    confidenceReason:\n      confidence === "medium"\n        ? "동일 그라인더 영점과 입력된 배전도·가공 방식에 초기 규칙을 적용했습니다. 실제 성공 기록은 아직 반영되지 않았습니다."\n        : "일부 원두 정보 또는 그라인더별 목표 분쇄 기준이 부족해 참고 시작점으로 제공합니다.",\n    appliedRules: [\n      createAppliedRule({\n        id: "dose.user-default.normalized.v1",\n        parameter: "dose",\n        description: "사용자 기본 원두량을 지원 범위와 1g 단위로 정규화",\n      }),\n      createAppliedRule({\n        id: "water.user-default.normalized.v1",\n        parameter: "water",\n        description: "사용자 기본 물량을 지원 범위와 5g 단위로 정규화",\n      }),\n      createAppliedRule({\n        id: "ratio.taste-goal.v1",\n        parameter: "ratio",\n        description: "맛 목표별 초기 추출 비율 적용",\n      }),\n      createAppliedRule({\n        id: "temperature.roast-process-taste.v1",\n        parameter: "temperature",\n        description: "배전도·가공 방식·맛 목표의 초기 온도 오프셋 적용",\n      }),\n      createAppliedRule({\n        id: \`grind.\${input.grinder.model}.v1\`,\n        parameter: "grind",\n        description: "그라인더 모델과 영점 기준의 초기 분쇄도 적용",\n        evidenceKind:\n          input.grinder.model === "holzklotz-e80"\n            ? "manufacturer"\n            : "heuristic",\n        sourceId:\n          input.grinder.model === "holzklotz-e80"\n            ? "manufacturer:holzklotz-e80-micron-reference"\n            : undefined,\n      }),\n      createAppliedRule({\n        id: \`pour.\${brewer}.\${input.tasteGoal}.v1\`,\n        parameter: "pour",\n        description: "드리퍼와 맛 목표별 푸어 단계 및 누적 물량 적용",\n      }),\n      createAppliedRule({\n        id: \`time.\${brewer}.v1\`,\n        parameter: "time",\n        description: "드리퍼 유형별 목표 추출 시간 범위 적용",\n      }),\n    ],\n  });\n}`,
  ],
]);

await patch("lib/recommendation/personalized.ts", [
  [
    "normalization imports",
    `import { createRecommendation } from "@/lib/recommendation/baseEngine";\nimport type {`,
    `import { createRecommendation } from "@/lib/recommendation/baseEngine";\nimport {\n  grinderDisplayRange,\n  normalizeGrinderSetting,\n  normalizeRatio,\n  normalizeRecommendation,\n  normalizeTemperatureCelsius,\n} from "@/lib/recommendation/normalization";\nimport {\n  appendAppliedRule,\n  createAppliedRule,\n  personalHistorySourceId,\n} from "@/lib/recommendation/ruleEvidence";\nimport type {`,
  ],
  [
    "duplicate helpers",
    `function clamp(value: number, min: number, max: number) {\n  return Math.min(max, Math.max(min, value));\n}\n\nfunction roundTo(value: number, step: number) {\n  const precision = step < 1 ? 10 : 1;\n  return Math.round(Math.round(value / step) * step * precision) / precision;\n}\n\n`,
    ``,
  ],
  [
    "grinder normalization",
    `  const step = input.grinder.displayStep ?? 1;\n  const referencePoints = input.grinder.micronReference?.points ?? [];\n  const fallbackBounds =\n    input.grinder.model === "1zpresso-k-ultra"\n      ? { min: 5.5, max: 8.5 }\n      : input.grinder.model === "baratza-encore"\n        ? { min: 8, max: 32 }\n        : { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };\n  const bounds =\n    referencePoints.length > 0\n      ? {\n          min:\n            Math.min(...referencePoints.map((point) => point.step)) +\n            input.grinder.personalOffset,\n          max:\n            Math.max(...referencePoints.map((point) => point.step)) +\n            input.grinder.personalOffset,\n        }\n      : fallbackBounds;\n  const next = clamp(roundTo(current + grindOffset, step), bounds.min, bounds.max);\n  const rangeWidth = input.grinder.model === "1zpresso-k-ultra" ? 0.2 : 2;\n  const rangeMin = roundTo(next - rangeWidth, step);\n  const rangeMax = roundTo(next + rangeWidth, step);`,
    `  const next = normalizeGrinderSetting(\n    current + grindOffset,\n    input.grinder,\n  );\n  const rangeWidth = input.grinder.model === "1zpresso-k-ultra" ? 0.2 : 2;\n  const range = grinderDisplayRange(next, rangeWidth, input.grinder);`,
  ],
  [
    "grinder range output",
    `    displayRange: \`${"${format(rangeMin)}~${format(rangeMax)}"}\`,`,
    `    displayRange: \`${"${format(range.min)}~${format(range.max)}"}\`,`,
  ],
  [
    "personal ratio",
    `  const adjustedRatio = clamp(\n    Math.round((base.ratio + ratioOffset) * 2) / 2,\n    13,\n    18,\n  );`,
    `  const adjustedRatio = normalizeRatio(base.ratio + ratioOffset);`,
  ],
  [
    "personal temperature",
    `  const adjustedTemperature = clamp(\n    base.temperatureCelsius + temperatureOffset,\n    82,\n    96,\n  );`,
    `  const adjustedTemperature = normalizeTemperatureCelsius(\n    base.temperatureCelsius + temperatureOffset,\n  );`,
  ],
  [
    "personalized output",
    `  return {\n    ...base,\n    ratio: adjustedRatio,\n    temperatureCelsius: adjustedTemperature,\n    grinder: personalizedGrinder(base, input),\n    reasons: [\n      ...base.reasons,\n      "같은 원두·음용 방식·드리퍼·그라인더·맛 방향의 이전 추출 평가에서 저장한 개인 보정값을 반영했습니다.",\n    ],\n    confidenceReason:\n      "초기 추천 규칙에 이 원두의 이전 추출 평가를 반영했습니다. 한 번에 한 변수만 조정한 결과를 추가로 기록하면 개인 추천의 신뢰도가 높아집니다.",\n  };`,
    `  return normalizeRecommendation(\n    {\n      ...base,\n      ratio: adjustedRatio,\n      temperatureCelsius: adjustedTemperature,\n      grinder: personalizedGrinder(base, input),\n      reasons: [\n        ...base.reasons,\n        "같은 원두·음용 방식·드리퍼·그라인더·맛 방향의 이전 추출 평가에서 저장한 개인 보정값을 반영했습니다.",\n      ],\n      confidenceReason:\n        "초기 추천 규칙에 이 원두의 이전 추출 평가를 반영했습니다. 한 번에 한 변수만 조정한 결과를 추가로 기록하면 개인 추천의 신뢰도가 높아집니다.",\n      appliedRules: appendAppliedRule(\n        base.appliedRules,\n        createAppliedRule({\n          id: "personalization.profile-offset.v1",\n          parameter: "personalization",\n          description: "동일 조건의 사용자 추출 기록에서 저장한 보정값 적용",\n          evidenceKind: "personal",\n          sourceId: personalHistorySourceId,\n        }),\n      ),\n    },\n    { deriveWaterFromRatio: ratioOffset !== 0 },\n  );`,
  ],
]);

await patch("lib/recommendation/engine.ts", [
  [
    "engine imports",
    `import { matchesBrewProfileIdentity } from "@/lib/brew/profileIdentity";\nimport { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";`,
    `import { matchesBrewProfileIdentity } from "@/lib/brew/profileIdentity";\nimport { normalizeRecommendation } from "@/lib/recommendation/normalization";\nimport { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";\nimport {\n  appendAppliedRule,\n  createAppliedRule,\n  personalHistorySourceId,\n} from "@/lib/recommendation/ruleEvidence";`,
  ],
  [
    "canonical personalized output",
    `  const recommendation = createPersonalizedRecommendation({\n    ...input,\n    recommendationOffset:\n      input.recommendationOffset ?? profile?.recommendationOffset,\n  });`,
    `  const recommendation = normalizeRecommendation(\n    createPersonalizedRecommendation({\n      ...input,\n      recommendationOffset:\n        input.recommendationOffset ?? profile?.recommendationOffset,\n    }),\n  );`,
  ],
  [
    "repeated success rule",
    `      confidence: "medium",\n      reasons: [`,
    `      confidence: "medium",\n      appliedRules: appendAppliedRule(\n        recommendation.appliedRules,\n        createAppliedRule({\n          id: "personalization.success-history.repeat.v1",\n          parameter: "confidence",\n          description: "동일 조건의 좋은 평가가 2회 이상 반복된 이력 반영",\n          evidenceKind: "personal",\n          sourceId: personalHistorySourceId,\n        }),\n      ),\n      reasons: [`,
  ],
  [
    "single success rule",
    `      confidence:\n        recommendation.confidence === "reference"\n          ? "medium"\n          : recommendation.confidence,\n      reasons: [`,
    `      confidence:\n        recommendation.confidence === "reference"\n          ? "medium"\n          : recommendation.confidence,\n      appliedRules: appendAppliedRule(\n        recommendation.appliedRules,\n        createAppliedRule({\n          id: "personalization.success-history.single.v1",\n          parameter: "confidence",\n          description: "동일 조건의 현재 베스트 1회 이력 반영",\n          evidenceKind: "personal",\n          sourceId: personalHistorySourceId,\n        }),\n      ),\n      reasons: [`,
  ],
]);

await patch("app/RecommendationDrawerV2.tsx", [
  [
    "normalization imports",
    `import {\n  applyRatioAndWater,\n  recommendedRatioForTaste,\n  recommendedWaterGrams,\n} from "@/lib/recommendation/recipeMath";`,
    `import {\n  normalizeDoseGrams,\n  recommendedRatioForTaste,\n  recommendedWaterGrams,\n  recommendationLimits,\n} from "@/lib/recommendation/normalization";`,
  ],
  [
    "local dose normalizer",
    `function normalizedDose(value: number) {\n  return Number.isFinite(value)\n    ? Math.min(40, Math.max(8, Math.round(value)))\n    : 15;\n}\n\n`,
    ``,
  ],
  [
    "dose preview",
    `  const dose = normalizedDose(preferences?.defaultDoseGrams ?? 15);`,
    `  const dose = normalizeDoseGrams(preferences?.defaultDoseGrams ?? 15);`,
  ],
  [
    "preference dose",
    `    const safeDose = normalizedDose(preferences.defaultDoseGrams);`,
    `    const safeDose = normalizeDoseGrams(preferences.defaultDoseGrams);`,
  ],
  [
    "engine output postprocessing",
    `    setRecommendation(applyRatioAndWater(generated, generated.ratio));`,
    `    setRecommendation(generated);`,
  ],
  [
    "dose input bounds",
    `                          min={8}\n                          max={40}\n                          step={1}`,
    `                          min={recommendationLimits.doseGrams.min}\n                          max={recommendationLimits.doseGrams.max}\n                          step={recommendationLimits.doseGrams.step}`,
  ],
]);

await patch("lib/recommendation/brewLaunch.ts", [
  [
    "launch normalization import",
    `import { estimateMicronsForSetting } from "@/lib/grinder/micronReference";`,
    `import { estimateMicronsForSetting } from "@/lib/grinder/micronReference";\nimport { normalizeRecommendation } from "@/lib/recommendation/normalization";`,
  ],
  [
    "snapshot rule ids",
    `    targetTimeMinSeconds: input.recommendation.targetTimeMinSeconds,\n    targetTimeMaxSeconds: input.recommendation.targetTimeMaxSeconds,\n    steps: timerSteps.map((step) => ({`,
    `    targetTimeMinSeconds: input.recommendation.targetTimeMinSeconds,\n    targetTimeMaxSeconds: input.recommendation.targetTimeMaxSeconds,\n    appliedRuleIds: input.recommendation.appliedRules.map((rule) => rule.id),\n    steps: timerSteps.map((step) => ({`,
  ],
  [
    "canonical launch function",
    `export function prepareRecommendationBrew(\n  input: PrepareRecommendationBrewInput,\n): RecommendationTimerStartDetail {\n  const fingerprint = recommendationFingerprint(input);\n  assertRecommendationLaunchAllowed(fingerprint);\n\n  const timestamp = new Date().toISOString();\n  const { profile, created } = createOrGetBrewProfile(input, timestamp);\n  const existingSessions = brewSessionStore.list();\n  const isFirstSession = !existingSessions.some(\n    (session) => session.profileId === profile.id,\n  );\n  const { steps, totalTime } = buildTimerSteps(input.recommendation);\n  const snapshot = buildSnapshot(input, totalTime, steps);\n  const session = createBrewSession(\n    {\n      beanId: input.bean.id,\n      profileId: profile.id,\n      drinkStyle: input.drinkStyle,\n      tasteGoal: input.tasteGoal,\n      recommendationConfidence: input.recommendation.confidence,\n      recipeSnapshot: snapshot,\n      note: "맞춤 추천에서 타이머 시작 시 자동 생성",\n      status: "trial",\n    },\n    timestamp,\n  );\n\n  if (!beanBrewProfileStore.upsert(profile)) {\n    throw new Error("추출 프로필을 저장하지 못했습니다.");\n  }\n\n  if (!brewSessionStore.upsert(session)) {\n    if (created) {\n      beanBrewProfileStore.remove(profile.id);\n    }\n    throw new Error("추출 기록을 저장하지 못했습니다.");\n  }\n\n  const nextProfile = withUpdatedTimestamp(\n    { ...profile, latestSessionId: session.id },\n    timestamp,\n  );\n\n  if (!beanBrewProfileStore.upsert(nextProfile)) {\n    brewSessionStore.remove(session.id);\n    if (created) {\n      beanBrewProfileStore.remove(profile.id);\n    }\n    throw new Error("추출 기록 연결을 저장하지 못했습니다.");\n  }\n\n  markRecommendationLaunch(fingerprint, session.id);\n\n  return {\n    recipe: buildTimerRecipe(input, session.id, snapshot, steps),\n    sessionId: session.id,\n    isFirstSession,\n  };\n}`,
    `export function prepareRecommendationBrew(\n  input: PrepareRecommendationBrewInput,\n): RecommendationTimerStartDetail {\n  const normalizedInput: PrepareRecommendationBrewInput = {\n    ...input,\n    recommendation: normalizeRecommendation(input.recommendation),\n  };\n  const fingerprint = recommendationFingerprint(normalizedInput);\n  assertRecommendationLaunchAllowed(fingerprint);\n\n  const timestamp = new Date().toISOString();\n  const { profile, created } = createOrGetBrewProfile(\n    normalizedInput,\n    timestamp,\n  );\n  const existingSessions = brewSessionStore.list();\n  const isFirstSession = !existingSessions.some(\n    (session) => session.profileId === profile.id,\n  );\n  const { steps, totalTime } = buildTimerSteps(\n    normalizedInput.recommendation,\n  );\n  const snapshot = buildSnapshot(normalizedInput, totalTime, steps);\n  const session = createBrewSession(\n    {\n      beanId: normalizedInput.bean.id,\n      profileId: profile.id,\n      drinkStyle: normalizedInput.drinkStyle,\n      tasteGoal: normalizedInput.tasteGoal,\n      recommendationConfidence: normalizedInput.recommendation.confidence,\n      recipeSnapshot: snapshot,\n      note: "맞춤 추천에서 타이머 시작 시 자동 생성",\n      status: "trial",\n    },\n    timestamp,\n  );\n\n  if (!beanBrewProfileStore.upsert(profile)) {\n    throw new Error("추출 프로필을 저장하지 못했습니다.");\n  }\n\n  if (!brewSessionStore.upsert(session)) {\n    if (created) {\n      beanBrewProfileStore.remove(profile.id);\n    }\n    throw new Error("추출 기록을 저장하지 못했습니다.");\n  }\n\n  const nextProfile = withUpdatedTimestamp(\n    { ...profile, latestSessionId: session.id },\n    timestamp,\n  );\n\n  if (!beanBrewProfileStore.upsert(nextProfile)) {\n    brewSessionStore.remove(session.id);\n    if (created) {\n      beanBrewProfileStore.remove(profile.id);\n    }\n    throw new Error("추출 기록 연결을 저장하지 못했습니다.");\n  }\n\n  markRecommendationLaunch(fingerprint, session.id);\n\n  return {\n    recipe: buildTimerRecipe(\n      normalizedInput,\n      session.id,\n      snapshot,\n      steps,\n    ),\n    sessionId: session.id,\n    isFirstSession,\n  };\n}`,
  ],
]);

await patch("lib/types/coffee.ts", [
  [
    "snapshot rule ids",
    `  targetTimeMinSeconds: number;\n  targetTimeMaxSeconds: number;\n  steps: RecipeSnapshotStep[];`,
    `  targetTimeMinSeconds: number;\n  targetTimeMaxSeconds: number;\n  /** Rule identifiers used to generate this saved recommendation. */\n  appliedRuleIds?: string[];\n  steps: RecipeSnapshotStep[];`,
  ],
]);

await patch("lib/storage/guards.ts", [
  [
    "snapshot rule id guard",
    `    isFiniteNumber(value.targetTimeMinSeconds) &&\n    isFiniteNumber(value.targetTimeMaxSeconds) &&\n    Array.isArray(value.steps) &&`,
    `    isFiniteNumber(value.targetTimeMinSeconds) &&\n    isFiniteNumber(value.targetTimeMaxSeconds) &&\n    (value.appliedRuleIds === undefined ||\n      isStringArray(value.appliedRuleIds)) &&\n    Array.isArray(value.steps) &&`,
  ],
]);

await patch("lib/storage/brewSessionGuard.ts", [
  [
    "optional string array helper",
    `function isOptionalString(value: unknown) {\n  return value === undefined || isString(value);\n}\n`,
    `function isOptionalString(value: unknown) {\n  return value === undefined || isString(value);\n}\n\nfunction isOptionalStringArray(value: unknown) {\n  return (\n    value === undefined ||\n    (Array.isArray(value) && value.every((item) => isString(item)))\n  );\n}\n`,
  ],
  [
    "snapshot rule id compatibility",
    `    isFiniteNumber(value.targetTimeMinSeconds) &&\n    isFiniteNumber(value.targetTimeMaxSeconds) &&\n    Array.isArray(value.steps) &&`,
    `    isFiniteNumber(value.targetTimeMinSeconds) &&\n    isFiniteNumber(value.targetTimeMaxSeconds) &&\n    isOptionalStringArray(value.appliedRuleIds) &&\n    Array.isArray(value.steps) &&`,
  ],
]);
