import { candidateSimulationScenarios } from "@/data/recommendation/candidateSimulationScenarios";
import { v60RatioSimulationScenarios } from "@/data/recommendation/v60RatioSimulationScenarios";
import { v60TemperatureSimulationScenarios } from "@/data/recommendation/v60TemperatureSimulationScenarios";
import { getCandidateRule } from "@/lib/recommendation/candidateRuleRegistry";
import { decideDialIn } from "@/lib/recommendation/dialInDecision";
import {
  kUltraOfficialCalibrationProfile,
  kUltraOfficialDialValue,
  kUltraOfficialRange,
} from "@/lib/recommendation/kUltraOfficialRange";
import { recommendedWaterGrams } from "@/lib/recommendation/normalization";
import {
  v60FoundationBloomWater,
  v60FoundationTargetTime,
} from "@/lib/recommendation/v60Foundation";
import { v60FoundationRatio } from "@/lib/recommendation/v60FoundationRatio";
import { v60RoastOnlyTemperature } from "@/lib/recommendation/v60RoastOnlyTemperature";
import type { CandidateRule } from "@/lib/types/candidateRule";
import type {
  CandidateSimulationExpectedValues,
  CandidateSimulationReport,
  CandidateSimulationResult,
  CandidateSimulationScenario,
} from "@/lib/types/candidateSimulation";
import type { RecommendationRuleParameter } from "@/lib/types/recommendation";

const allCandidateSimulationScenarios = [
  ...candidateSimulationScenarios,
  ...v60TemperatureSimulationScenarios,
  ...v60RatioSimulationScenarios,
] as const;

function includesOrUnrestricted<T>(allowed: readonly T[] | undefined, actual: T) {
  return !allowed || allowed.includes(actual);
}

function matchesScope(rule: CandidateRule, scenario: CandidateSimulationScenario) {
  const brew = rule.scope.brew;
  const grinder = rule.scope.grinder;
  const brewMatches =
    !brew ||
    (includesOrUnrestricted(brew.brewerTypes, scenario.context.brewerType) &&
      includesOrUnrestricted(brew.drinkStyles, scenario.context.drinkStyle) &&
      includesOrUnrestricted(brew.filterMaterials, scenario.context.filterMaterial));
  const grinderMatches =
    !grinder?.models ||
    (scenario.context.grinderModel !== undefined &&
      grinder.models.includes(scenario.context.grinderModel));
  const calibrationMatches =
    rule.validationPlan?.implementationKey !== "k-ultra-official-zero-range-v1" ||
    scenario.context.grinderCalibrationProfile === kUltraOfficialCalibrationProfile;
  return brewMatches && grinderMatches && calibrationMatches;
}

function valuesMatch(
  actual: CandidateSimulationExpectedValues | undefined,
  expected: CandidateSimulationExpectedValues | undefined,
) {
  if (!expected) return true;
  return Object.entries(expected).every(
    ([key, value]) =>
      actual?.[key as keyof CandidateSimulationExpectedValues] === value,
  );
}

function resultForOutOfScope(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  const decision = "not-applicable" as const;
  return {
    scenarioId: scenario.id,
    candidateRuleId: rule.id,
    applies: false,
    decision,
    changedParameters: [],
    expectedDecision: scenario.expectedDecision,
    expectedValues: scenario.expectedValues,
    passed: decision === scenario.expectedDecision,
    reason:
      "후보 규칙의 브루어·음료 스타일·필터·그라인더 또는 교정 프로필 적용 범위 밖입니다.",
  };
}

function simulateGrind(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  if (!scenario.signal) throw new Error(`Missing grind signal: ${scenario.id}`);
  const decision = decideDialIn({
    actualSeconds: scenario.signal.actualTimeSeconds,
    minimumSeconds: scenario.signal.targetTimeMinSeconds,
    maximumSeconds: scenario.signal.targetTimeMaxSeconds,
    tastingResult: scenario.signal.tastingResult,
  });
  const changedParameters: readonly RecommendationRuleParameter[] =
    decision === "finer" || decision === "coarser" ? ["grind"] : [];
  return {
    scenarioId: scenario.id,
    candidateRuleId: rule.id,
    applies: true,
    decision,
    changedParameters,
    expectedDecision: scenario.expectedDecision,
    passed:
      decision === scenario.expectedDecision &&
      changedParameters.every((parameter) =>
        rule.validationPlan?.changedParameters.includes(parameter),
      ),
    reason:
      decision === "finer"
        ? "목표 하한보다 빠른 추출이므로 다른 조건을 고정하고 분쇄도를 미세화합니다."
        : decision === "coarser"
          ? "목표 상한보다 느리거나 떫은맛이 기록돼 분쇄도를 굵게 조정합니다."
          : "목표 시간과 감각 결과를 충족해 현재 분쇄도를 유지합니다.",
  };
}

function simulateFoundationPour(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  if (!scenario.recipeInput) throw new Error(`Missing recipe input: ${scenario.id}`);
  const actualValues = {
    bloomWaterGrams: v60FoundationBloomWater(
      scenario.recipeInput.doseGrams,
      scenario.recipeInput.waterGrams,
    ),
    bloomTimeSeconds: 30,
    mainPourStartSeconds: 30,
  } as const;
  const decision = "apply" as const;
  return {
    scenarioId: scenario.id,
    candidateRuleId: rule.id,
    applies: true,
    decision,
    changedParameters: ["pour"],
    expectedDecision: scenario.expectedDecision,
    actualValues,
    expectedValues: scenario.expectedValues,
    passed:
      decision === scenario.expectedDecision &&
      valuesMatch(actualValues, scenario.expectedValues),
    reason:
      "원두량의 3배를 5g 단위로 반올림하되 총 물량의 25%로 제한하고, 30초부터 원형 본 주입을 적용합니다.",
  };
}

function simulateFoundationTime(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  const actualValues = {
    targetTimeMinSeconds: v60FoundationTargetTime.min,
    targetTimeMaxSeconds: v60FoundationTargetTime.max,
  } as const;
  const decision = "apply" as const;
  return {
    scenarioId: scenario.id,
    candidateRuleId: rule.id,
    applies: true,
    decision,
    changedParameters: ["time"],
    expectedDecision: scenario.expectedDecision,
    actualValues,
    expectedValues: scenario.expectedValues,
    passed:
      decision === scenario.expectedDecision &&
      valuesMatch(actualValues, scenario.expectedValues),
    reason:
      "전문가 일반 범위의 2분 30초 하한과 제조사 3분 상한의 교집합을 적용합니다.",
  };
}

function simulateKUltraOfficialRange(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  if (!scenario.recipeInput) throw new Error(`Missing recipe input: ${scenario.id}`);
  const actualValues = {
    grinderDisplayValue: kUltraOfficialDialValue(
      scenario.recipeInput.grinderPersonalOffset ?? 0,
    ),
    grinderRangeMin: kUltraOfficialRange.min,
    grinderRangeMax: kUltraOfficialRange.max,
  } as const;
  const decision = "apply" as const;
  return {
    scenarioId: scenario.id,
    candidateRuleId: rule.id,
    applies: true,
    decision,
    changedParameters: ["grind"],
    expectedDecision: scenario.expectedDecision,
    actualValues,
    expectedValues: scenario.expectedValues,
    passed:
      decision === scenario.expectedDecision &&
      valuesMatch(actualValues, scenario.expectedValues),
    reason:
      "제조사 저항 시작 영점의 공식 8.0~9.0 범위에서 중앙값 8.5와 프로필 보정값을 적용합니다.",
  };
}

function simulateV60RoastOnlyTemperature(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  const roastLevel = scenario.recipeInput?.roastLevel;
  if (!roastLevel) throw new Error(`Missing roast level: ${scenario.id}`);
  const actualValues = {
    temperatureCelsius: v60RoastOnlyTemperature(roastLevel),
  } as const;
  const decision = "apply" as const;
  return {
    scenarioId: scenario.id,
    candidateRuleId: rule.id,
    applies: true,
    decision,
    changedParameters: ["temperature"],
    expectedDecision: scenario.expectedDecision,
    actualValues,
    expectedValues: scenario.expectedValues,
    passed:
      decision === scenario.expectedDecision &&
      valuesMatch(actualValues, scenario.expectedValues),
    reason:
      "기존 배전도 기준 온도만 사용하고 맛 목표와 가공 방식의 추가 온도 오프셋은 적용하지 않습니다.",
  };
}

function simulateV60FoundationRatio(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  if (!scenario.recipeInput) throw new Error(`Missing recipe input: ${scenario.id}`);
  const actualValues = {
    ratio: v60FoundationRatio,
    waterGrams: recommendedWaterGrams(
      scenario.recipeInput.doseGrams,
      v60FoundationRatio,
    ),
  } as const;
  const decision = "apply" as const;
  return {
    scenarioId: scenario.id,
    candidateRuleId: rule.id,
    applies: true,
    decision,
    changedParameters: ["ratio"],
    expectedDecision: scenario.expectedDecision,
    actualValues,
    expectedValues: scenario.expectedValues,
    passed:
      decision === scenario.expectedDecision &&
      valuesMatch(actualValues, scenario.expectedValues),
    reason:
      "맛 목표별 고정 비율 오프셋 없이 1:16으로 시작하고 도징에서 물량을 다시 계산합니다.",
  };
}

export function simulateCandidateScenario(
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  const rule = getCandidateRule(scenario.candidateRuleId);
  if (!rule) throw new Error(`Unknown candidate rule: ${scenario.candidateRuleId}`);
  if (!matchesScope(rule, scenario)) return resultForOutOfScope(rule, scenario);

  switch (rule.validationPlan?.implementationKey) {
    case "v60-hot-paper-grind-direction-v1":
      return simulateGrind(rule, scenario);
    case "v60-hot-paper-foundation-pour-v1":
      return simulateFoundationPour(rule, scenario);
    case "v60-hot-paper-foundation-time-v1":
      return simulateFoundationTime(rule, scenario);
    case "k-ultra-official-zero-range-v1":
      return simulateKUltraOfficialRange(rule, scenario);
    case "v60-hot-paper-roast-only-temperature-v1":
      return simulateV60RoastOnlyTemperature(rule, scenario);
    case "v60-hot-paper-foundation-ratio-16-v1":
      return simulateV60FoundationRatio(rule, scenario);
    default:
      throw new Error(
        `Unsupported candidate implementation: ${rule.validationPlan?.implementationKey ?? "missing"}`,
      );
  }
}

export function runCandidateSimulation(
  candidateRuleId: string,
): CandidateSimulationReport {
  const rule = getCandidateRule(candidateRuleId);
  if (!rule) throw new Error(`Unknown candidate rule: ${candidateRuleId}`);
  const scenarioById = new Map<string, CandidateSimulationScenario>(
    allCandidateSimulationScenarios.map((scenario) => [scenario.id, scenario]),
  );
  const scenarioIds = rule.validationPlan?.scenarioIds ?? [];
  const results: CandidateSimulationResult[] = scenarioIds.map((scenarioId) => {
    const scenario = scenarioById.get(scenarioId);
    if (!scenario) {
      return {
        scenarioId,
        candidateRuleId,
        applies: false,
        decision: "not-applicable",
        changedParameters: [],
        expectedDecision: "not-applicable",
        passed: false,
        reason: "검증 계획이 존재하지 않는 시나리오 ID를 참조합니다.",
      };
    }
    return simulateCandidateScenario(scenario);
  });
  const passedScenarios = results.filter((result) => result.passed).length;
  return {
    candidateRuleId,
    totalScenarios: results.length,
    passedScenarios,
    failedScenarios: results.length - passedScenarios,
    allPassed: results.length > 0 && passedScenarios === results.length,
    results,
  };
}
