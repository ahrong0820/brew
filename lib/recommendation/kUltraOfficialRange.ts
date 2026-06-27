import type { GrinderProfile } from "@/lib/types/coffee";

export const kUltraOfficialCalibrationProfile =
  "manufacturer-resistance-start-zero";
export const kUltraOfficialRuleId =
  "grind.1zpresso-k-ultra.official-zero.v1";
export const kUltraOfficialRange = {
  min: 8,
  max: 9,
  center: 8.5,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

export function isKUltraOfficialProfile(
  grinder: Pick<GrinderProfile, "model" | "calibrationProfile">,
) {
  return (
    grinder.model === "1zpresso-k-ultra" &&
    grinder.calibrationProfile === kUltraOfficialCalibrationProfile
  );
}

export function kUltraOfficialDialValue(personalOffset = 0) {
  return clamp(
    roundToTenth(kUltraOfficialRange.center + personalOffset),
    kUltraOfficialRange.min,
    kUltraOfficialRange.max,
  );
}
