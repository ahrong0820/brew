import type {
  GrinderMicronReferencePoint,
  GrinderProfile,
} from "@/lib/types/coffee";

export interface MicronSettingRecommendation {
  targetMicrons: number;
  setting: number;
  settingMin: number;
  settingMax: number;
  referenceMinMicrons: number;
  referenceMaxMicrons: number;
  isClamped: boolean;
}

function sortByMicrons(points: GrinderMicronReferencePoint[]) {
  return [...points].sort((a, b) => a.microns - b.microns);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number) {
  const precision = step < 1 ? 10 : 1;
  return Math.round(Math.round(value / step) * step * precision) / precision;
}

function interpolateSetting(
  points: GrinderMicronReferencePoint[],
  targetMicrons: number,
) {
  const sorted = sortByMicrons(points);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (!first || !last) {
    return null;
  }

  if (targetMicrons <= first.microns) {
    return first.step;
  }

  if (targetMicrons >= last.microns) {
    return last.step;
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const lower = sorted[index - 1];
    const upper = sorted[index];

    if (targetMicrons <= upper.microns) {
      const micronSpan = upper.microns - lower.microns;
      const settingSpan = upper.step - lower.step;
      const ratio = (targetMicrons - lower.microns) / micronSpan;
      return lower.step + settingSpan * ratio;
    }
  }

  return last.step;
}

export function recommendSettingForMicrons(
  profile: GrinderProfile,
  targetMicrons: number,
): MicronSettingRecommendation | null {
  const reference = profile.micronReference;

  if (!reference || reference.points.length < 2) {
    return null;
  }

  const sorted = sortByMicrons(reference.points);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const displayStep = profile.displayStep ?? 1;
  const tolerance = reference.typicalToleranceMicrons ?? 100;
  const clampedTarget = clamp(targetMicrons, first.microns, last.microns);
  const center = interpolateSetting(sorted, clampedTarget);
  const lower = interpolateSetting(
    sorted,
    clamp(targetMicrons - tolerance, first.microns, last.microns),
  );
  const upper = interpolateSetting(
    sorted,
    clamp(targetMicrons + tolerance, first.microns, last.microns),
  );

  if (center === null || lower === null || upper === null) {
    return null;
  }

  const offset = profile.personalOffset;
  const setting = roundToStep(center + offset, displayStep);
  const settingMin = roundToStep(Math.min(lower, upper) + offset, displayStep);
  const settingMax = roundToStep(Math.max(lower, upper) + offset, displayStep);

  return {
    targetMicrons: Math.round(targetMicrons),
    setting,
    settingMin,
    settingMax,
    referenceMinMicrons: first.microns,
    referenceMaxMicrons: last.microns,
    isClamped: targetMicrons < first.microns || targetMicrons > last.microns,
  };
}

export function formatGrinderSetting(profile: GrinderProfile, value: number) {
  if (profile.displayUnit === "dial") {
    return value.toFixed(1);
  }

  return String(Math.round(value));
}

export function nearbyMicronReferencePoints(
  profile: GrinderProfile,
  targetMicrons: number,
  limit = 3,
) {
  const points = profile.micronReference?.points ?? [];

  return [...points]
    .sort(
      (a, b) =>
        Math.abs(a.microns - targetMicrons) -
        Math.abs(b.microns - targetMicrons),
    )
    .slice(0, limit)
    .sort((a, b) => a.step - b.step);
}
