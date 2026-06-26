import { isCompatibleOriginRegions } from "@/lib/domain/originRegions";
import { isBean } from "@/lib/storage/guards";
import type { Bean } from "@/lib/types/coffee";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCompatibleBean(value: unknown): value is Bean {
  if (!isRecord(value) || !isBean(value)) {
    return false;
  }

  return isCompatibleOriginRegions(value.originRegions);
}
