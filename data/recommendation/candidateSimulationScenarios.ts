import type { CandidateSimulationScenario } from "@/lib/types/candidateSimulation";

const grindCandidateRuleId = "candidate:grind:v60-hot:dial-in-v1";
const pourCandidateRuleId = "candidate:pour:v60-hot:foundation-v1";
const timeCandidateRuleId = "candidate:time:v60-hot:foundation-v1";

export const candidateSimulationScenarios = [
  {
    id: "candidate-sim:v60-hot-paper:fast-sour-k-ultra",
    candidateRuleId: grindCandidateRuleId,
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
    candidateRuleId: grindCandidateRuleId,
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
    candidateRuleId: grindCandidateRuleId,
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
    candidateRuleId: grindCandidateRuleId,
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
    candidateRuleId: grindCandidateRuleId,
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
    candidateRuleId: grindCandidateRuleId,
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
    candidateRuleId: grindCandidateRuleId,
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
    candidateRuleId: grindCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "metal" },
    signal: {
      tastingResult: "too-sour",
      actualTimeSeconds: 130,
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-foundation-pour:15g-240g",
    candidateRuleId: pourCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240 },
    expectedDecision: "apply",
    expectedValues: {
      bloomWaterGrams: 45,
      bloomTimeSeconds: 30,
      mainPourStartSeconds: 30,
    },
  },
  {
    id: "candidate-sim:v60-foundation-pour:22g-352g",
    candidateRuleId: pourCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 22, waterGrams: 352 },
    expectedDecision: "apply",
    expectedValues: {
      bloomWaterGrams: 65,
      bloomTimeSeconds: 30,
      mainPourStartSeconds: 30,
    },
  },
  {
    id: "candidate-sim:v60-foundation-pour:cap-at-quarter",
    candidateRuleId: pourCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 20, waterGrams: 200 },
    expectedDecision: "apply",
    expectedValues: {
      bloomWaterGrams: 50,
      bloomTimeSeconds: 30,
      mainPourStartSeconds: 30,
    },
  },
  {
    id: "candidate-sim:v60-foundation-pour:iced-out-of-scope",
    candidateRuleId: pourCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "iced", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240 },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-foundation-pour:switch-out-of-scope",
    candidateRuleId: pourCandidateRuleId,
    context: { brewerType: "switch", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240 },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-foundation-time:hot-paper",
    candidateRuleId: timeCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    expectedDecision: "apply",
    expectedValues: {
      targetTimeMinSeconds: 150,
      targetTimeMaxSeconds: 180,
    },
  },
  {
    id: "candidate-sim:v60-foundation-time:iced-out-of-scope",
    candidateRuleId: timeCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "iced", filterMaterial: "paper" },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-foundation-time:metal-out-of-scope",
    candidateRuleId: timeCandidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "metal" },
    expectedDecision: "not-applicable",
  },
] as const satisfies readonly CandidateSimulationScenario[];
