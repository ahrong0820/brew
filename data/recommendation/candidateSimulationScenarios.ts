import type { CandidateSimulationScenario } from "@/lib/types/candidateSimulation";

const candidateRuleId = "candidate:grind:v60-hot:dial-in-v1";

export const candidateSimulationScenarios = [
  {
    id: "candidate-sim:v60-hot-paper:fast-sour-k-ultra",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    signal: {
      tastingResult: "too-sour",
      actualTimeSeconds: 130,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "finer",
  },
  {
    id: "candidate-sim:v60-hot-paper:fast-weak-encore",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    signal: {
      tastingResult: "too-weak",
      actualTimeSeconds: 125,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "finer",
  },
  {
    id: "candidate-sim:v60-hot-paper:slow-astringent-k-ultra",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    signal: {
      tastingResult: "bitter-astringent",
      actualTimeSeconds: 205,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "coarser",
  },
  {
    id: "candidate-sim:v60-hot-paper:target-astringent-encore",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    signal: {
      tastingResult: "bitter-astringent",
      actualTimeSeconds: 170,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "coarser",
  },
  {
    id: "candidate-sim:v60-hot-paper:target-good-k-ultra",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    signal: {
      tastingResult: "good",
      actualTimeSeconds: 165,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "hold",
  },
  {
    id: "candidate-sim:switch-hot-paper:fast-sour-out-of-scope",
    candidateRuleId,
    context: { brewerType: "switch", drinkStyle: "hot", filterMaterial: "paper" },
    signal: {
      tastingResult: "too-sour",
      actualTimeSeconds: 130,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-iced-paper:fast-sour-out-of-scope",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "iced", filterMaterial: "paper" },
    signal: {
      tastingResult: "too-sour",
      actualTimeSeconds: 130,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-hot-metal:fast-sour-out-of-scope",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "metal" },
    signal: {
      tastingResult: "too-sour",
      actualTimeSeconds: 130,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "not-applicable",
  },
] as const satisfies readonly CandidateSimulationScenario[];
