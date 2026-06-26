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
