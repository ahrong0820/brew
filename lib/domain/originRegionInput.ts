import { normalizeOriginRegions } from "@/lib/domain/originRegions";

export function parseOriginRegionInput(value: string): readonly string[] | undefined {
  return normalizeOriginRegions(value.split(/[\n,]/));
}

export function formatOriginRegionInput(
  originRegions: readonly string[] | undefined,
): string {
  return originRegions?.join(", ") ?? "";
}
