import { normalizeOriginRegions } from "@/lib/domain/originRegions";
import { createLocalId } from "@/lib/storage/ids";
import type {
  Bean,
  BeanBrewProfile,
  BrewSession,
} from "@/lib/types/coffee";

type BeanInput = Omit<Bean, "id" | "createdAt" | "updatedAt">;
type BeanBrewProfileInput = Omit<
  BeanBrewProfile,
  "id" | "createdAt" | "updatedAt"
>;
type BrewSessionInput = Omit<
  BrewSession,
  "id" | "createdAt" | "updatedAt"
>;

export function createBean(
  input: BeanInput,
  timestamp = new Date().toISOString(),
): Bean {
  return {
    ...input,
    id: createLocalId("bean"),
    name: input.name.trim(),
    roaster: input.roaster?.trim() || undefined,
    originRegions: normalizeOriginRegions(input.originRegions),
    variety: input.variety?.trim() || undefined,
    memo: input.memo?.trim() || undefined,
    flavorNotes: input.flavorNotes
      ?.map((note) => note.trim())
      .filter(Boolean),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createBeanBrewProfile(
  input: BeanBrewProfileInput,
  timestamp = new Date().toISOString(),
): BeanBrewProfile {
  return {
    ...input,
    id: createLocalId("profile"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createBrewSession(
  input: BrewSessionInput,
  timestamp = new Date().toISOString(),
): BrewSession {
  return {
    ...input,
    id: createLocalId("session"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function withUpdatedTimestamp<T extends { updatedAt: string }>(
  value: T,
  timestamp = new Date().toISOString(),
): T {
  return {
    ...value,
    updatedAt: timestamp,
  };
}
