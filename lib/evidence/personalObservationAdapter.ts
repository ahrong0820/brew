import type {
  Bean,
  BeanBrewProfile,
  BrewSession,
  DrinkStyle,
  TastingResult,
} from "@/lib/types/coffee";
import type {
  EvidenceContext,
  EvidenceObservation,
  ObservationOutcome,
  ObservationVariable,
} from "@/lib/types/evidence";

export const personalEvidenceSourceId = "local:user-brew-history";

export interface PersonalObservationContext {
  bean?: Bean;
  profile?: BeanBrewProfile;
}

const tastingDescriptions: Record<TastingResult, string> = {
  "too-sour": "사용자가 신맛이 과도하다고 평가했습니다.",
  "not-sweet-enough": "사용자가 단맛이 부족하다고 평가했습니다.",
  "bitter-astringent": "사용자가 쓴맛 또는 떫은맛이 과도하다고 평가했습니다.",
  "too-weak": "사용자가 농도나 강도가 약하다고 평가했습니다.",
  "too-strong": "사용자가 농도나 강도가 강하다고 평가했습니다.",
  "aroma-muted": "사용자가 향이 충분히 드러나지 않았다고 평가했습니다.",
  good: "사용자가 좋은 추출 결과로 평가했습니다.",
};

function normalizedDrinkStyle(
  session: BrewSession,
  profile?: BeanBrewProfile,
): DrinkStyle {
  return (
    session.drinkStyle ??
    session.recipeSnapshot.drinkStyle ??
    profile?.drinkStyle ??
    "hot"
  );
}

function exactRange(value: number, unit: string) {
  return { min: value, max: value, unit };
}

function roastAgeDays(bean: Bean | undefined, session: BrewSession) {
  if (!bean?.roastDate) {
    return undefined;
  }

  const roastTime = Date.parse(bean.roastDate);
  const sessionTime = Date.parse(session.createdAt);
  if (!Number.isFinite(roastTime) || !Number.isFinite(sessionTime)) {
    return undefined;
  }

  return Math.max(0, Math.floor((sessionTime - roastTime) / 86_400_000));
}

function observationContext(
  session: BrewSession,
  context: PersonalObservationContext,
): EvidenceContext {
  const snapshot = session.recipeSnapshot;
  const bean = context.bean?.id === session.beanId ? context.bean : undefined;
  const ageDays = roastAgeDays(bean, session);

  return {
    bean: bean
      ? {
          originCountries: [bean.originCountry],
          originGroups: [bean.originGroup],
          roastLevels: [bean.roastLevel],
          processes: [bean.process],
          varieties: bean.variety ? [bean.variety] : undefined,
          roastAgeDays:
            ageDays === undefined ? undefined : exactRange(ageDays, "day"),
        }
      : undefined,
    brew: {
      brewerTypes: [snapshot.brewerType],
      drinkStyles: [normalizedDrinkStyle(session, context.profile)],
      tasteGoals: [session.tasteGoal],
      doseGrams: exactRange(snapshot.doseGrams, "gram"),
      ratio: exactRange(snapshot.ratio, "water-per-coffee"),
      waterGrams: exactRange(snapshot.waterGrams, "gram"),
      temperatureCelsius: exactRange(
        snapshot.temperatureCelsius,
        "celsius",
      ),
      targetTimeSeconds: {
        min: snapshot.targetTimeMinSeconds,
        max: snapshot.targetTimeMaxSeconds,
        unit: "second",
      },
    },
    grinder: snapshot.grinderModel
      ? {
          models: [snapshot.grinderModel],
          settingRange:
            snapshot.grindLevel === undefined
              ? undefined
              : exactRange(snapshot.grindLevel, "profile-setting"),
          representativeMicrons:
            snapshot.estimatedRepresentativeMicrons === undefined
              ? undefined
              : exactRange(
                  snapshot.estimatedRepresentativeMicrons,
                  "micrometer",
                ),
        }
      : undefined,
  };
}

function observationVariables(session: BrewSession): ObservationVariable[] {
  const snapshot = session.recipeSnapshot;
  const variables: ObservationVariable[] = [
    {
      name: "doseGrams",
      role: "condition",
      value: { kind: "number", value: snapshot.doseGrams, unit: "gram" },
    },
    {
      name: "waterGrams",
      role: "condition",
      value: { kind: "number", value: snapshot.waterGrams, unit: "gram" },
    },
    {
      name: "brewRatio",
      role: "condition",
      value: {
        kind: "number",
        value: snapshot.ratio,
        unit: "water-per-coffee",
      },
    },
    {
      name: "temperatureCelsius",
      role: "condition",
      value: {
        kind: "number",
        value: snapshot.temperatureCelsius,
        unit: "celsius",
      },
    },
    {
      name: "targetTimeSeconds",
      role: "recommendation",
      value: {
        kind: "range",
        min: snapshot.targetTimeMinSeconds,
        max: snapshot.targetTimeMaxSeconds,
        unit: "second",
      },
    },
    {
      name: "pourCount",
      role: "condition",
      value: {
        kind: "number",
        value: snapshot.steps.length,
        unit: "count",
      },
    },
  ];

  if (snapshot.grindLevel !== undefined) {
    variables.push({
      name: "grinderSetting",
      role: "condition",
      value: {
        kind: "number",
        value: snapshot.grindLevel,
        unit: "profile-setting",
      },
    });
  }

  if (snapshot.estimatedRepresentativeMicrons !== undefined) {
    variables.push({
      name: "representativeMicrons",
      role: "measurement",
      value: {
        kind: "number",
        value: snapshot.estimatedRepresentativeMicrons,
        unit: "micrometer",
      },
    });
  }

  if (session.actualTimeSeconds !== undefined) {
    variables.push({
      name: "actualTimeSeconds",
      role: "measurement",
      value: {
        kind: "number",
        value: session.actualTimeSeconds,
        unit: "second",
      },
    });
  }

  return variables;
}

function effectiveTastingResult(session: BrewSession): TastingResult | undefined {
  if (session.tastingResult) {
    return session.tastingResult;
  }

  return session.status === "good" || session.status === "current-best"
    ? "good"
    : undefined;
}

function observationOutcome(
  session: BrewSession,
): ObservationOutcome | undefined {
  const tastingResult = effectiveTastingResult(session);
  if (!tastingResult) {
    return undefined;
  }

  return {
    variable: "overallPreference",
    direction: tastingResult === "good" ? "increase" : "association",
    value: { kind: "enum", value: tastingResult },
    sensoryDescription: tastingDescriptions[tastingResult],
  };
}

export function brewSessionToObservation(
  session: BrewSession,
  context: PersonalObservationContext = {},
): EvidenceObservation {
  const drinkStyle = normalizedDrinkStyle(session, context.profile);

  return {
    id: `obs:personal:${session.id}`,
    sourceId: personalEvidenceSourceId,
    kind: "user-outcome",
    reviewStatus: "reviewed",
    summary: `${session.recipeSnapshot.brewerType} ${drinkStyle} 개인 추출 기록`,
    excerpt: {
      locator: { section: `BrewSession:${session.id}` },
      paraphrase:
        "사용자가 저장한 실제 레시피, 추출 시간과 맛 평가를 개인 관찰값으로 변환했습니다.",
    },
    context: observationContext(session, context),
    variables: observationVariables(session),
    outcome: observationOutcome(session),
    assessment: {
      extractionConfidence: "high",
      directness: "direct",
      methodologicalStrength: "personal-observation",
      reproducibility: "single-source",
      limitations: [
        "통제 실험이 아닌 사용자의 단일 추출 기록입니다.",
        "물 조성, 주변 환경과 실제 교반량이 기록되지 않았을 수 있습니다.",
        "다른 사용자에게 일반화하는 근거로 단독 사용하지 않습니다.",
      ],
      reviewedBy: "local-session-validator",
      reviewedAt: session.updatedAt,
    },
    tags: [
      "personal",
      session.status,
      drinkStyle,
      session.recipeSnapshot.brewerType,
      session.tasteGoal,
    ],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
