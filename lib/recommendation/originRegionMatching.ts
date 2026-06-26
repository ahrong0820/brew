import type { EvidenceContext } from "@/lib/types/evidence";
import type { ConditionMatchState } from "@/lib/types/evidenceWeight";

function arrayMatch<T>(
  evidenceValues: readonly T[] | undefined,
  targetValues: readonly T[] | undefined,
): ConditionMatchState {
  if (!targetValues?.length) {
    return "not-applicable";
  }
  if (!evidenceValues?.length) {
    return "unknown";
  }

  const overlap = targetValues.filter((value) => evidenceValues.includes(value));
  if (overlap.length === 0) {
    return "mismatch";
  }
  return overlap.length === targetValues.length ? "match" : "partial";
}

export function normalizeOriginRegionKey(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizedRegions(values: readonly string[] | undefined): readonly string[] {
  if (!values?.length) {
    return [];
  }

  return Array.from(
    new Set(values.map(normalizeOriginRegionKey).filter(Boolean)),
  );
}

function regionMatch(
  evidenceRegions: readonly string[] | undefined,
  targetRegions: readonly string[] | undefined,
): ConditionMatchState {
  const normalizedTarget = normalizedRegions(targetRegions);
  if (normalizedTarget.length === 0) {
    return "not-applicable";
  }

  const normalizedEvidence = normalizedRegions(evidenceRegions);
  if (normalizedEvidence.length === 0) {
    return "unknown";
  }

  return arrayMatch(normalizedEvidence, normalizedTarget);
}

export function calculateOriginMatch(
  evidenceBean: EvidenceContext["bean"],
  targetBean: EvidenceContext["bean"],
): ConditionMatchState {
  const targetCountries = targetBean?.originCountries;
  const targetGroups = targetBean?.originGroups;
  const targetRegions = targetBean?.originRegions;
  if (!targetCountries?.length && !targetGroups?.length && !targetRegions?.length) {
    return "not-applicable";
  }

  const evidenceCountries = evidenceBean?.originCountries;
  const evidenceGroups = evidenceBean?.originGroups;
  const evidenceRegions = evidenceBean?.originRegions;
  if (
    !evidenceCountries?.length &&
    !evidenceGroups?.length &&
    !evidenceRegions?.length
  ) {
    return "unknown";
  }

  const countryState = arrayMatch(evidenceCountries, targetCountries);
  const groupState = arrayMatch(evidenceGroups, targetGroups);
  const regionState = regionMatch(evidenceRegions, targetRegions);

  if (targetCountries?.length) {
    if (countryState === "match") {
      if (targetRegions?.length && evidenceRegions?.length) {
        return regionState === "match" ? "match" : "partial";
      }
      return "match";
    }
    if (countryState === "partial") {
      return "partial";
    }
    if (groupState === "match" || groupState === "partial") {
      return "partial";
    }
    if (countryState === "mismatch") {
      return "mismatch";
    }
    return groupState === "mismatch" ? "mismatch" : "unknown";
  }

  if (
    targetRegions?.length &&
    evidenceRegions?.length &&
    regionState === "match" &&
    (groupState === "match" || groupState === "partial")
  ) {
    return "partial";
  }

  if (
    groupState === "match" ||
    groupState === "partial" ||
    groupState === "mismatch"
  ) {
    return groupState;
  }
  return "unknown";
}
