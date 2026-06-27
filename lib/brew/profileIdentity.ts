export type BrewProfileDrinkStyle = "hot" | "iced";

export interface BrewProfileIdentity {
  beanId: string;
  brewerType: string;
  grinderProfileId: string;
  tasteGoal: string;
  drinkStyle?: BrewProfileDrinkStyle;
  /** Legacy profiles without this field remain in an isolated default scope. */
  sourceRecipeId?: string;
}

export function normalizeDrinkStyle(value: unknown): BrewProfileDrinkStyle {
  return value === "iced" ? "iced" : "hot";
}

export function normalizeSourceRecipeId(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : "legacy-default";
}

export function drinkStyleLabel(value: unknown) {
  return normalizeDrinkStyle(value) === "iced" ? "ICED" : "HOT";
}

export function brewProfileIdentityKey(identity: BrewProfileIdentity) {
  return [
    identity.beanId,
    identity.brewerType,
    identity.grinderProfileId,
    identity.tasteGoal,
    normalizeDrinkStyle(identity.drinkStyle),
    normalizeSourceRecipeId(identity.sourceRecipeId),
  ].join("|");
}

export function matchesBrewProfileIdentity(
  left: BrewProfileIdentity,
  right: BrewProfileIdentity,
) {
  return brewProfileIdentityKey(left) === brewProfileIdentityKey(right);
}
