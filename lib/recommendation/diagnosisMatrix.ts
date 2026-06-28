import type {
  BrewAdjustmentAction,
  BrewPaceAssessment,
  BrewerType,
} from "@/lib/types/coffee";

export type SensoryIssue =
  | "sour"
  | "bitter"
  | "astringent"
  | "weak"
  | "strong"
  | "sweetness-low"
  | "aroma-good"
  | "aroma-muted"
  | "body-low";

export type DiagnosisVariable =
  | "grind"
  | "temperature"
  | "ratio"
  | "agitation"
  | "immersion-time"
  | "pour-structure"
  | "none";

export type DiagnosisDirection =
  | BrewAdjustmentAction
  | "less-agitation"
  | "more-agitation"
  | "shorter-immersion"
  | "longer-immersion"
  | "gentler-pour";

export interface TasteDiagnosisInput {
  brewerType: BrewerType;
  brewPaceAssessment?: BrewPaceAssessment;
  issues: readonly SensoryIssue[];
  repeatedGrindDirectionCount?: number;
}

export interface TasteDiagnosis {
  variable: DiagnosisVariable;
  direction: DiagnosisDirection;
  reason: string;
}

function includesAll(
  issues: ReadonlySet<SensoryIssue>,
  expected: readonly SensoryIssue[],
) {
  return expected.every((issue) => issues.has(issue));
}

function switchRepeatedGrind(
  diagnosis: TasteDiagnosis,
  input: TasteDiagnosisInput,
  issues: ReadonlySet<SensoryIssue>,
): TasteDiagnosis {
  if (
    diagnosis.variable !== "grind" ||
    (input.repeatedGrindDirectionCount ?? 0) < 2
  ) {
    return diagnosis;
  }

  if (input.brewerType === "clever") {
    return issues.has("sour") || issues.has("sweetness-low")
      ? {
          variable: "immersion-time",
          direction: "longer-immersion",
          reason:
            "같은 방향의 분쇄 조정을 두 번 반복했으므로 분쇄도 대신 침출 시간을 한 단계 늘립니다.",
        }
      : {
          variable: "agitation",
          direction: "less-agitation",
          reason:
            "같은 방향의 분쇄 조정을 두 번 반복했으므로 분쇄도 대신 교반을 한 단계 줄입니다.",
        };
  }

  if (issues.has("weak") || issues.has("body-low")) {
    return {
      variable: "ratio",
      direction: "less-water",
      reason:
        "같은 방향의 분쇄 조정을 두 번 반복했으므로 분쇄도 대신 물 비율을 줄여 농도를 확인합니다.",
    };
  }

  return {
    variable: "temperature",
    direction:
      issues.has("sour") || issues.has("sweetness-low") ? "hotter" : "cooler",
    reason:
      "같은 방향의 분쇄 조정을 두 번 반복했으므로 분쇄도 대신 온도를 한 단계 조정합니다.",
  };
}

export function diagnoseTaste(input: TasteDiagnosisInput): TasteDiagnosis {
  const issues = new Set(input.issues);
  const pace = input.brewPaceAssessment;

  if (issues.size === 0) {
    return {
      variable: "none",
      direction: "hold",
      reason: "뚜렷한 결함이 없어 현재 조건을 한 번 더 재현합니다.",
    };
  }

  if (includesAll(issues, ["sour", "weak"])) {
    const diagnosis: TasteDiagnosis =
      pace === "slow"
        ? {
            variable: "temperature",
            direction: "hotter",
            reason:
              "시고 묽지만 드로다운은 느리므로 더 곱게 갈지 않고 온도를 높여 추출을 보완합니다.",
          }
        : {
            variable: "grind",
            direction: "finer",
            reason:
              "시고 묽은 미추출 조합이므로 다른 조건을 유지하고 분쇄도를 한 단계 곱게 합니다.",
          };
    return switchRepeatedGrind(diagnosis, input, issues);
  }

  if (includesAll(issues, ["sour", "astringent"])) {
    return input.brewerType === "clever"
      ? {
          variable: "agitation",
          direction: "less-agitation",
          reason:
            "시면서 떫은 조합은 불균일 추출 가능성이 높아 클레버 교반을 한 단계 줄입니다.",
        }
      : {
          variable: "pour-structure",
          direction: "gentler-pour",
          reason:
            "시면서 떫은 조합은 불균일 추출 가능성이 높아 푸어 높이와 교반을 줄여 유속을 안정화합니다.",
        };
  }

  if (includesAll(issues, ["bitter", "astringent"])) {
    return input.brewerType === "clever" && pace !== "slow"
      ? {
          variable: "agitation",
          direction: "less-agitation",
          reason:
            "클레버에서 쓰고 떫으면 분쇄도보다 교반을 먼저 줄여 미분 이동과 과다 추출을 억제합니다.",
        }
      : {
          variable: "temperature",
          direction: "cooler",
          reason:
            "쓰고 떫은 과다 추출 신호이므로 다른 조건을 유지하고 온도를 낮춥니다.",
        };
  }

  if (includesAll(issues, ["aroma-good", "body-low"])) {
    return {
      variable: "ratio",
      direction: "less-water",
      reason:
        "향은 잘 열렸지만 바디가 약하므로 추출 구조를 유지하고 물 비율만 줄입니다.",
    };
  }

  if (pace === "fast" && (issues.has("bitter") || issues.has("astringent"))) {
    return {
      variable: "temperature",
      direction: "cooler",
      reason:
        "드로다운은 빠르지만 과다 추출 맛이므로 유속만 보고 더 곱게 갈지 않고 온도를 낮춥니다.",
    };
  }

  if (pace === "slow" && (issues.has("sour") || issues.has("sweetness-low"))) {
    return {
      variable: "temperature",
      direction: "hotter",
      reason:
        "드로다운은 느리지만 미추출 맛이므로 더 곱게 갈지 않고 온도를 높입니다.",
    };
  }

  if (issues.has("weak") || issues.has("body-low")) {
    return {
      variable: "ratio",
      direction: "less-water",
      reason: "농도와 바디가 부족하므로 물 비율을 한 단계 줄입니다.",
    };
  }

  if (issues.has("strong")) {
    return {
      variable: "ratio",
      direction: "more-water",
      reason: "농도가 과하므로 물 비율을 한 단계 늘립니다.",
    };
  }

  if (issues.has("sour") || issues.has("sweetness-low")) {
    const diagnosis: TasteDiagnosis =
      pace === "fast"
        ? {
            variable: "grind",
            direction: "finer",
            reason: "빠른 드로다운과 미추출 맛이 함께 나타나 분쇄도를 곱게 합니다.",
          }
        : {
            variable: "temperature",
            direction: "hotter",
            reason: "미추출 맛을 보완하기 위해 온도를 한 단계 높입니다.",
          };
    return switchRepeatedGrind(diagnosis, input, issues);
  }

  if (issues.has("aroma-muted")) {
    return input.brewerType === "clever"
      ? {
          variable: "immersion-time",
          direction: "shorter-immersion",
          reason:
            "클레버의 향이 답답하면 침출 시간을 줄여 향미 분리를 확인합니다.",
        }
      : {
          variable: "grind",
          direction: "coarser",
          reason: "향이 답답하면 분쇄도를 굵게 해 향미 분리를 확인합니다.",
        };
  }

  return {
    variable: "none",
    direction: "hold",
    reason: "현재 기록만으로 우선순위가 명확하지 않아 조건을 유지합니다.",
  };
}
