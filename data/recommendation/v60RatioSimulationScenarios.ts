import type { CandidateSimulationScenario } from "@/lib/types/candidateSimulation";

const candidateRuleId = "candidate:ratio:v60-hot:foundation-16-v1";

export const v60RatioSimulationScenarios = [
  {
    id: "candidate-sim:v60-ratio:sweet",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240, tasteGoal: "sweet" },
    expectedDecision: "apply",
    expectedValues: { ratio: 16, waterGrams: 240 },
  },
  {
    id: "candidate-sim:v60-ratio:bright",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240, tasteGoal: "bright" },
    expectedDecision: "apply",
    expectedValues: { ratio: 16, waterGrams: 240 },
  },
  {
    id: "candidate-sim:v60-ratio:balanced",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240, tasteGoal: "balanced" },
    expectedDecision: "apply",
    expectedValues: { ratio: 16, waterGrams: 240 },
  },
  {
    id: "candidate-sim:v60-ratio:body",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240, tasteGoal: "body" },
    expectedDecision: "apply",
    expectedValues: { ratio: 16, waterGrams: 240 },
  },
  {
    id: "candidate-sim:v60-ratio:dose-20",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 20, waterGrams: 300, tasteGoal: "balanced" },
    expectedDecision: "apply",
    expectedValues: { ratio: 16, waterGrams: 320 },
  },
  {
    id: "candidate-sim:v60-ratio:iced-out-of-scope",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "iced", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240, tasteGoal: "bright" },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-ratio:switch-out-of-scope",
    candidateRuleId,
    context: { brewerType: "switch", drinkStyle: "hot", filterMaterial: "paper" },
    recipeInput: { doseGrams: 15, waterGrams: 240, tasteGoal: "balanced" },
    expectedDecision: "not-applicable",
  },
  {
    id: "candidate-sim:v60-ratio:metal-out-of-scope",
    candidateRuleId,
    context: { brewerType: "v60", drinkStyle: "hot", filterMaterial: "metal" },
    recipeInput: { doseGrams: 15, waterGrams: 240, tasteGoal: "sweet" },
    expectedDecision: "not-applicable",
  },
] as const satisfies readonly CandidateSimulationScenario[];
