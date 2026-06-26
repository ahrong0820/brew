import type {
  BeanBrewProfile,
  BrewSession,
  BrewerType,
  DrinkStyle,
  TasteGoal,
} from "@/lib/types/coffee";

export interface PersonalEvidenceIdentity {
  beanId: string;
  brewerType: BrewerType;
  grinderProfileId: string;
  tasteGoal: TasteGoal;
  drinkStyle: DrinkStyle;
}

function normalizeDrinkStyle(value: DrinkStyle | undefined): DrinkStyle {
  return value ?? "hot";
}

export function personalEvidenceIdentityFromProfile(
  profile: BeanBrewProfile,
): PersonalEvidenceIdentity {
  return {
    beanId: profile.beanId,
    brewerType: profile.brewerType,
    grinderProfileId: profile.grinderProfileId,
    tasteGoal: profile.tasteGoal,
    drinkStyle: normalizeDrinkStyle(profile.drinkStyle),
  };
}

export function isSuccessfulPersonalSession(session: BrewSession) {
  return (
    session.status === "good" ||
    session.status === "current-best" ||
    session.tastingResult === "good"
  );
}

export function matchesPersonalEvidenceIdentity(
  session: BrewSession,
  profile: BeanBrewProfile,
  identity: PersonalEvidenceIdentity,
) {
  const sessionDrinkStyle = normalizeDrinkStyle(
    session.drinkStyle ?? session.recipeSnapshot.drinkStyle,
  );

  return (
    session.profileId === profile.id &&
    session.beanId === identity.beanId &&
    profile.beanId === identity.beanId &&
    profile.brewerType === identity.brewerType &&
    profile.grinderProfileId === identity.grinderProfileId &&
    session.tasteGoal === identity.tasteGoal &&
    profile.tasteGoal === identity.tasteGoal &&
    sessionDrinkStyle === identity.drinkStyle &&
    normalizeDrinkStyle(profile.drinkStyle) === identity.drinkStyle
  );
}
