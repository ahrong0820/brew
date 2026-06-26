export function isOriginRegionCollection(
  value: unknown,
): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isCompatibleOriginRegions(
  value: unknown,
): value is readonly string[] | undefined {
  return value === undefined || isOriginRegionCollection(value);
}

export function normalizeOriginRegions(
  originRegions: readonly string[] | undefined,
): readonly string[] | undefined {
  if (!originRegions?.length) {
    return undefined;
  }

  const normalized = Array.from(
    new Set(originRegions.map((region) => region.trim()).filter(Boolean)),
  );

  return normalized.length > 0 ? normalized : undefined;
}
