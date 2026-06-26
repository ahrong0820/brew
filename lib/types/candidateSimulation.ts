import type {
  BrewerType,
  DrinkStyle,
  TastingResult,
} from "@/lib/types/coffee";
import type { RecommendationRuleParameter } from "@/lib/types/recommendation";

export type CandidateSimulationDecision =
  | "finer"
  | "coarser"
  | "hold"
  | "not-applicable";

export interface CandidateSimulationScenario {
  id: string;
  candidateRuleId: string;
  context: {
    brewerType: BrewerType;
    drinkStyle: DrinkStyle;
    filterMaterial: string;
  };
  signal: {
    tastingResult: TastingResult;
    actualTimeSeconds: number;
    targetTimeMinSeconds: number;
    targetTimeMaxSeconds: number;
  };
  expectedDecision: CandidateSimulationDecision;
}

export interface CandidateSimulationResult {
  scenarioId: string;
  candidateRuleId: string;
  applies: boolean;
  decision: CandidateSimulationDecision;
  changedParameters: readonly RecommendationRuleParameter[];
  expectedDecision: CandidateSimulationDecision;
  passed: boolean;
  reason: string;
}

export interface CandidateSimulationReport {
  candidateRuleId: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  allPassed: boolean;
  results: readonly CandidateSimulationResult[];
}
