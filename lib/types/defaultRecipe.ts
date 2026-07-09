export type WaterAmount = number | { min: number; max: number };

export interface BrewStep {
  label: string;
  start: number;
  end: number;
  targetWater: number;
  displayTargetWater?: WaterAmount;
  displayStepWater?: WaterAmount;
  cue: string;
}

export interface Recipe {
  id: string;
  name: string;
  origin: string;
  method: string;
  profile: string;
  tags: string[];
  dose: number;
  water: number;
  brewWater?: number;
  bypassWater?: WaterAmount;
  finalWater?: WaterAmount;
  ratio: string;
  temp: string;
  grind: string;
  totalTime: number;
  notes: string[];
  steps: BrewStep[];
}
