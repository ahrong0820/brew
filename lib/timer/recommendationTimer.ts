import { startRecommendationBrewSessionClock } from "./brewSessionClock.ts";

export type TimerWaterAmount = number | { min: number; max: number };

export interface TimerBrewStep {
  label: string;
  start: number;
  end: number;
  targetWater: number;
  displayTargetWater?: TimerWaterAmount;
  displayStepWater?: TimerWaterAmount;
  cue: string;
}

export interface TimerRecipe {
  id: string;
  name: string;
  origin: string;
  method: string;
  profile: string;
  tags: string[];
  dose: number;
  water: number;
  brewWater?: number;
  bypassWater?: TimerWaterAmount;
  finalWater?: TimerWaterAmount;
  ratio: string;
  temp: string;
  grind: string;
  totalTime: number;
  notes: string[];
  steps: TimerBrewStep[];
}

export interface RecommendationTimerStartDetail {
  recipe: TimerRecipe;
  sessionId: string;
  isFirstSession: boolean;
}

export const recommendationTimerStartEvent = "brew:recommendation-timer-start";

export function dispatchRecommendationTimerStart(
  detail: RecommendationTimerStartDetail,
) {
  startRecommendationBrewSessionClock(detail);
  window.dispatchEvent(
    new CustomEvent<RecommendationTimerStartDetail>(
      recommendationTimerStartEvent,
      { detail },
    ),
  );
}
