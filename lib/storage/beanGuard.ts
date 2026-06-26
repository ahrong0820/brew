import { isBean } from "@/lib/storage/guards";
import type { Bean } from "@/lib/types/coffee";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isCompatibleBean(value: unknown): value is Bean {
  if (!isRecord(value) || !isBean(value)) {
    return false;
  }

  return value.originRegions === undefined || isStringArray(value.originRegions);
}
