export type RecipeTemperature =
  | {
      status: "verified";
      display: string;
      celsius?: number;
      note?: string;
    }
  | {
      status: "app-default";
      display: string;
      celsius: number;
      note: string;
    }
  | {
      status: "unknown";
      display: string;
      note: string;
    };

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
  temperature?: RecipeTemperature;
  grind: string;
  totalTime: number;
  notes: string[];
  steps: BrewStep[];
}
