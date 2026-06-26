import { candidateSimulationScenarios } from "@/data/recommendation/candidateSimulationScenarios";
import { getCandidateRule } from "@/lib/recommendation/candidateRuleRegistry";
import type { CandidateRule } from "@/lib/types/candidateRule";
import type {
  CandidateSimulationDecision,
  CandidateSimulationReport,
  CandidateSimulationResult,
  CandidateSimulationScenario,
} from "@/lib/types/candidateSimulation";

function includesOrUnrestricted<T>(
  allowed: readonly T[] | undefined,
  actual: T,
) {
  return !allowed || allowed.includes(actual);
}

function matchesScope(
  rule: CandidateRule,
  scenario: CandidateSimulationScenario,
) {
  const brew = rule.scope.brew;
  if (!brew) {
    return true;
  }

  return (
    includesOrUnrestricted(brew.brewerTypes, scenario.context.brewerType) &&
    includesOrUnrestricted(brew.drinkStyles, scenario.context.drinkStyle) &&
    includesOrUnrestricted(
      brew.filterMaterials,
      scenario.context.filterMaterial,
    )
  );
}

function decideV60HotPaperGrindDirection(
  scenario: CandidateSimulationScenario,
): CandidateSimulationDecision {
  const { signal } = scenario;

  if (signal.actualTimeSeconds < signal.targetTimeMinSeconds - 10) {
    return "finer";
  }

  if (signal.actualTimeSeconds > signal.targetTimeMaxSeconds + 10) {
    return "coarser";
  }

  if (signal.tastingResult === "bitter-astringent") {
    return "coarser";
  }

  return "hold";
}

export function simulateCandidateScenario(
  scenario: CandidateSimulationScenario,
): CandidateSimulationResult {
  const rule = getCandidateRule(scenario.candidateRuleId);
  if (!rule) {
    throw new Error(`Unknown candidate rule: ${scenario.candidateRuleId}`);
  }

  if (!matchesScope(rule, scenario)) {
    const decision = "not-applicable" as const;
    return {
      scenarioId: scenario.id,
      candidateRuleId: rule.id,
      applies: false,
      decision,
      changedParameters: [],
      expectedDecision: scenario.expectedDecision,
      passed: decision === scenario.expectedDecision,
      reason: "후보 규칙의 브루어·음료 스타일·필터 적용 범위 밖입니다.",
    };
  }

  const validationPlan = rule.validationPlan;
  if (
    !validationPlan ||
    validationPlan.implementationKey !== "v60-hot-paper-grind-direction-v1"
  ) {
    throw new Error(
      `Unsupported candidate implementation: ${validationPlan?.implementationKey ?? "missing"}`,
    );
  }

  const decision = decideV60HotPaperGrindDirection(scenario);
  const changedParameters =
    decision === "finer" || decision === "coarser"
      ? (["grind"] as const)
      : ([] as const);

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
        validationPlan.changedParameters.includes(parameter),
      ),
    reason:
      decision === "finer"
        ? "목표 하한보다 빠른 추출이므로 다른 조건을 고정하고 분쇄도 미세화 방향을 검토합니다."
        : decision === "coarser"
          ? "목표 상한보다 느리거나 떫은맛이 기록돼 분쇄도 굵게 조정 방향을 검토합니다."
          : "목표 시간과 감각 결과가 후보의 조정 조건을 충족하지 않아 현재 분쇄도를 유지합니다.",
  };
}

export function runCandidateSimulation(
  candidateRuleId: string,
): CandidateSimulationReport {
  const rule = getCandidateRule(candidateRuleId);
  if (!rule) {
    throw new Error(`Unknown candidate rule: ${candidateRuleId}`);
  }

  const scenarioById = new Map<string, CandidateSimulationScenario>(
    candidateSimulationScenarios.map((scenario) => [scenario.id, scenario]),
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
