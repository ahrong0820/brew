import type {
  BrewerType,
  DrinkStyle,
  TastingResult,
} from "@/lib/types/coffee";
import type { RecommendationRuleParameter } from "@/lib/types/recommendation";

export type CandidateSimulationDecision =
  | "apply"
  | "finer"
  | "coarser"
  | "hold"
  | "not-applicable";

export interface CandidateSimulationExpectedValues {
  bloomWaterGrams?: number;
  bloomTimeSeconds?: number;
  mainPourStartSeconds?: number;
  targetTimeMinSeconds?: number;
  targetTimeMaxSeconds?: number;
}

export interface CandidateSimulationScenario {
  id: string;
  candidateRuleId: string;
  context: {
    brewerType: BrewerType;
    drinkStyle: DrinkStyle;
    filterMaterial: string;
  };
  signal?: {
    tastingResult: TastingResult;
    actualTimeSeconds: number;
    targetTimeMinSeconds: number;
    targetTimeMaxSeconds: number;
  };
  recipeInput?: {
    doseGrams: number;
    waterGrams: number;
  };
  expectedDecision: CandidateSimulationDecision;
  expectedValues?: CandidateSimulationExpectedValues;
}

export interface CandidateSimulationResult {
  scenarioId: string;
  candidateRuleId: string;
  applies: boolean;
  decision: CandidateSimulationDecision;
  changedParameters: readonly RecommendationRuleParameter[];
  expectedDecision: CandidateSimulationDecision;
  actualValues?: CandidateSimulationExpectedValues;
  expectedValues?: CandidateSimulationExpectedValues;
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
