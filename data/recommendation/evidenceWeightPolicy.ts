import type { EvidenceWeightPolicy } from "@/lib/types/evidenceWeight";

export const evidenceWeightPolicy = {
  version: "1.0.0",
  sourceTypeWeights: {
    paper: 1,
    manufacturer: 0.9,
    expert: 0.6,
    competition: 0.5,
    personal: 0.7,
    internal: 0.2,
  },
  methodologyWeights: {
    controlled: 1,
    observational: 0.9,
    "recipe-example": 1,
    "expert-opinion": 1,
    "manufacturer-specification": 1,
    "personal-observation": 1,
    heuristic: 1,
    unknown: 0.6,
  },
  directnessWeights: {
    direct: 1,
    "partially-applicable": 0.75,
    indirect: 0.5,
  },
  reproducibilityWeights: {
    replicated: 1,
    "multiple-sources": 0.95,
    "single-source": 0.85,
    unknown: 0.7,
  },
  reviewStatusWeights: {
    reviewed: 1,
    draft: 0.65,
    superseded: 0.4,
    rejected: 0,
  },
  extractionConfidenceWeights: {
    high: 1,
    medium: 0.9,
    low: 0.75,
  },
  reviewMetadataWeight: {
    complete: 1,
    incomplete: 0.85,
  },
  personalSuccessWeight: {
    single: 0.5,
    repeated: 1,
  },
  conditionDimensionWeights: {
    brewer: 0.18,
    drinkStyle: 0.12,
    roastLevel: 0.12,
    process: 0.1,
    doseRatio: 0.12,
    grinderBurr: 0.12,
    filter: 0.08,
    water: 0.08,
    tasteGoal: 0.08,
  },
  conditionStateWeights: {
    match: 1,
    partial: 0.75,
    unknown: 0.85,
    mismatch: 0.35,
    "not-applicable": 1,
  },
  independence: {
    independent: 1,
    sameSourceAdditional: 0,
    sameLineageAdditional: 0,
  },
} as const satisfies EvidenceWeightPolicy;
