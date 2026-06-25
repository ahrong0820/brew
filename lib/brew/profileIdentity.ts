export type BrewProfileDrinkStyle = "hot" | "iced";

export interface BrewProfileIdentity {
  beanId: string;
  brewerType: string;
  grinderProfileId: string;
  tasteGoal: string;
  drinkStyle?: BrewProfileDrinkStyle;
}

export function normalizeDrinkStyle(value: unknown): BrewProfileDrinkStyle {
  return value === "iced" ? "iced" : "hot";
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
  ].join("|");
}

export function matchesBrewProfileIdentity(
  left: BrewProfileIdentity,
  right: BrewProfileIdentity,
) {
  return brewProfileIdentityKey(left) === brewProfileIdentityKey(right);
}
