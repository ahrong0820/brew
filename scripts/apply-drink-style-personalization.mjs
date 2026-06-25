import { readFile, writeFile } from "node:fs/promises";

async function patch(path, replacements) {
  let source = await readFile(path, "utf8");

  for (const [label, search, replacement] of replacements) {
    const matches = source.split(search).length - 1;
    if (matches !== 1) {
      throw new Error(`${path} ${label}: expected one match, found ${matches}`);
    }
    source = source.replace(search, replacement);
  }

  await writeFile(path, source);
}

await patch("lib/types/coffee.ts", [
  [
    "snapshot drink style",
    `export interface RecipeSnapshot {\n  sourceTemplateId: string;\n  sourceTemplateName: string;\n  brewerType: BrewerType;\n  doseGrams: number;`,
    `export interface RecipeSnapshot {\n  sourceTemplateId: string;\n  sourceTemplateName: string;\n  brewerType: BrewerType;\n  /** Legacy snapshots without this field are treated as hot. */\n  drinkStyle?: DrinkStyle;\n  doseGrams: number;`,
  ],
  [
    "profile drink style",
    `export interface BeanBrewProfile {\n  id: string;\n  beanId: string;\n  brewerType: BrewerType;\n  grinderProfileId: string;`,
    `export interface BeanBrewProfile {\n  id: string;\n  beanId: string;\n  brewerType: BrewerType;\n  /** Legacy profiles without this field are treated as hot. */\n  drinkStyle?: DrinkStyle;\n  grinderProfileId: string;`,
  ],
  [
    "session drink style",
    `export interface BrewSession {\n  id: string;\n  beanId: string;\n  profileId: string;\n  tasteGoal: TasteGoal;`,
    `export interface BrewSession {\n  id: string;\n  beanId: string;\n  profileId: string;\n  /** Legacy sessions without this field are treated as hot. */\n  drinkStyle?: DrinkStyle;\n  tasteGoal: TasteGoal;`,
  ],
]);

await patch("lib/storage/guards.ts", [
  [
    "profile guard",
    `    isString(value.beanId) &&\n    isOneOf(value.brewerType, brewerTypes) &&\n    isString(value.grinderProfileId) &&`,
    `    isString(value.beanId) &&\n    isOneOf(value.brewerType, brewerTypes) &&\n    (value.drinkStyle === undefined ||\n      isOneOf(value.drinkStyle, drinkStyles)) &&\n    isString(value.grinderProfileId) &&`,
  ],
  [
    "snapshot guard",
    `    isString(value.sourceTemplateName) &&\n    isOneOf(value.brewerType, brewerTypes) &&\n    isFiniteNumber(value.doseGrams) &&`,
    `    isString(value.sourceTemplateName) &&\n    isOneOf(value.brewerType, brewerTypes) &&\n    (value.drinkStyle === undefined ||\n      isOneOf(value.drinkStyle, drinkStyles)) &&\n    isFiniteNumber(value.doseGrams) &&`,
  ],
  [
    "session guard",
    `    isString(value.beanId) &&\n    isString(value.profileId) &&\n    isOneOf(value.tasteGoal, tasteGoals) &&`,
    `    isString(value.beanId) &&\n    isString(value.profileId) &&\n    (value.drinkStyle === undefined ||\n      isOneOf(value.drinkStyle, drinkStyles)) &&\n    isOneOf(value.tasteGoal, tasteGoals) &&`,
  ],
]);

await patch("lib/storage/brewSessionGuard.ts", [
  [
    "snapshot compatibility",
    `    isString(value.sourceTemplateName) &&\n    ["v60", "clever", "switch", "other"].includes(String(value.brewerType)) &&\n    isFiniteNumber(value.doseGrams) &&`,
    `    isString(value.sourceTemplateName) &&\n    ["v60", "clever", "switch", "other"].includes(String(value.brewerType)) &&\n    (value.drinkStyle === undefined ||\n      ["hot", "iced"].includes(String(value.drinkStyle))) &&\n    isFiniteNumber(value.doseGrams) &&`,
  ],
  [
    "session compatibility",
    `    isString(value.beanId) &&\n    isString(value.profileId) &&\n    tasteGoals.includes(String(value.tasteGoal)) &&`,
    `    isString(value.beanId) &&\n    isString(value.profileId) &&\n    (value.drinkStyle === undefined ||\n      ["hot", "iced"].includes(String(value.drinkStyle))) &&\n    tasteGoals.includes(String(value.tasteGoal)) &&`,
  ],
]);

await patch("lib/recommendation/engine.ts", [
  [
    "identity import",
    `import { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";\n`,
    `import { matchesBrewProfileIdentity } from "@/lib/brew/profileIdentity";\nimport { createPersonalizedRecommendation } from "@/lib/recommendation/personalized";\n`,
  ],
  [
    "profile match",
    `  const profile = beanBrewProfileStore.list().find(\n    (candidate) =>\n      candidate.beanId === input.bean.id &&\n      candidate.brewerType === input.preferences.defaultBrewer &&\n      candidate.grinderProfileId === input.grinder.id &&\n      candidate.tasteGoal === input.tasteGoal,\n  );`,
    `  const profile = beanBrewProfileStore.list().find((candidate) =>\n    matchesBrewProfileIdentity(candidate, {\n      beanId: input.bean.id,\n      brewerType: input.preferences.defaultBrewer,\n      grinderProfileId: input.grinder.id,\n      tasteGoal: input.tasteGoal,\n      drinkStyle: input.preferences.defaultDrinkStyle,\n    }),\n  );`,
  ],
  [
    "confidence reason repeated",
    `        "같은 원두·드리퍼·그라인더·맛 방향에서 성공 기록이 2회 이상 재현되어 개인화 추천 근거가 강화되었습니다.",`,
    `        "같은 원두·음용 방식·드리퍼·그라인더·맛 방향에서 성공 기록이 2회 이상 재현되어 개인화 추천 근거가 강화되었습니다.",`,
  ],
]);

await patch("lib/recommendation/personalized.ts", [
  [
    "personalized reason",
    `      "같은 원두·드리퍼·그라인더·맛 방향의 이전 추출 평가에서 저장한 개인 보정값을 반영했습니다.",`,
    `      "같은 원두·음용 방식·드리퍼·그라인더·맛 방향의 이전 추출 평가에서 저장한 개인 보정값을 반영했습니다.",`,
  ],
]);

await patch("lib/recommendation/brewLaunch.ts", [
  [
    "identity import",
    `import {\n  assertRecommendationLaunchAllowed,`,
    `import {\n  drinkStyleLabel,\n  matchesBrewProfileIdentity,\n} from "@/lib/brew/profileIdentity";\nimport {\n  assertRecommendationLaunchAllowed,`,
  ],
  [
    "drink style type",
    `  BeanBrewProfile,\n  BrewerType,\n  GrinderProfile,`,
    `  BeanBrewProfile,\n  BrewerType,\n  DrinkStyle,\n  GrinderProfile,`,
  ],
  [
    "input drink style",
    `  grinder: GrinderProfile;\n  brewerType: BrewerType;\n  tasteGoal: TasteGoal;`,
    `  grinder: GrinderProfile;\n  brewerType: BrewerType;\n  drinkStyle: DrinkStyle;\n  tasteGoal: TasteGoal;`,
  ],
  [
    "fingerprint drink style",
    `    grinderId: input.grinder.id,\n    brewerType: input.brewerType,\n    tasteGoal: input.tasteGoal,`,
    `    grinderId: input.grinder.id,\n    brewerType: input.brewerType,\n    drinkStyle: input.drinkStyle,\n    tasteGoal: input.tasteGoal,`,
  ],
  [
    "find profile signature",
    `function findBrewProfile(\n  beanId: string,\n  brewerType: BrewerType,\n  grinderProfileId: string,\n  tasteGoal: TasteGoal,\n) {\n  return beanBrewProfileStore.list().find(\n    (profile) =>\n      profile.beanId === beanId &&\n      profile.brewerType === brewerType &&\n      profile.grinderProfileId === grinderProfileId &&\n      profile.tasteGoal === tasteGoal,\n  );\n}`,
    `function findBrewProfile(\n  beanId: string,\n  brewerType: BrewerType,\n  grinderProfileId: string,\n  tasteGoal: TasteGoal,\n  drinkStyle: DrinkStyle,\n) {\n  return beanBrewProfileStore.list().find((profile) =>\n    matchesBrewProfileIdentity(profile, {\n      beanId,\n      brewerType,\n      grinderProfileId,\n      tasteGoal,\n      drinkStyle,\n    }),\n  );\n}`,
  ],
  [
    "find profile call",
    `    input.grinder.id,\n    input.tasteGoal,\n  );`,
    `    input.grinder.id,\n    input.tasteGoal,\n    input.drinkStyle,\n  );`,
  ],
  [
    "create profile style",
    `        beanId: input.bean.id,\n        brewerType: input.brewerType,\n        grinderProfileId: input.grinder.id,`,
    `        beanId: input.bean.id,\n        brewerType: input.brewerType,\n        drinkStyle: input.drinkStyle,\n        grinderProfileId: input.grinder.id,`,
  ],
  [
    "snapshot template and style",
    `    sourceTemplateId: \`recommendation-\${input.brewerType}-\${input.tasteGoal}\`,\n    sourceTemplateName: input.recommendation.templateName,\n    brewerType: input.brewerType,\n    doseGrams: input.recommendation.doseGrams,`,
    `    sourceTemplateId: \`recommendation-\${input.drinkStyle}-\${input.brewerType}-\${input.tasteGoal}\`,\n    sourceTemplateName: input.recommendation.templateName,\n    brewerType: input.brewerType,\n    drinkStyle: input.drinkStyle,\n    doseGrams: input.recommendation.doseGrams,`,
  ],
  [
    "timer profile and tags",
    `    profile: tasteLabels[input.tasteGoal],\n    tags: ["맞춤 추천", brewerLabels[input.brewerType], tasteLabels[input.tasteGoal]],`,
    `    profile: \`\${drinkStyleLabel(input.drinkStyle)} · \${tasteLabels[input.tasteGoal]}\`,\n    tags: [\n      "맞춤 추천",\n      drinkStyleLabel(input.drinkStyle),\n      brewerLabels[input.brewerType],\n      tasteLabels[input.tasteGoal],\n    ],`,
  ],
  [
    "timer notes style",
    `    notes: [\n      \`목표 추출 시간 \${formatSeconds(snapshot.targetTimeMinSeconds)}~\${formatSeconds(snapshot.targetTimeMaxSeconds)}\`,`,
    `    notes: [\n      \`음용 방식 \${drinkStyleLabel(input.drinkStyle)}\`,\n      \`목표 추출 시간 \${formatSeconds(snapshot.targetTimeMinSeconds)}~\${formatSeconds(snapshot.targetTimeMaxSeconds)}\`,`,
  ],
  [
    "session style",
    `      beanId: input.bean.id,\n      profileId: profile.id,\n      tasteGoal: input.tasteGoal,`,
    `      beanId: input.bean.id,\n      profileId: profile.id,\n      drinkStyle: input.drinkStyle,\n      tasteGoal: input.tasteGoal,`,
  ],
]);

await patch("app/RecommendationDrawerV2.tsx", [
  [
    "launch drink style",
    `        grinder: selectedGrinder,\n        brewerType: preferences.defaultBrewer,\n        tasteGoal,`,
    `        grinder: selectedGrinder,\n        brewerType: preferences.defaultBrewer,\n        drinkStyle: preferences.defaultDrinkStyle,\n        tasteGoal,`,
  ],
  [
    "iced notice wording",
    `                        이번 단계의 자동 물량은 따뜻한 추출 기준입니다. 아이스용 추출수와 얼음 배분은 다음 단계에서 추가합니다.`,
    `                        ICED 개인화 기록은 HOT과 분리해 저장됩니다. 현재 자동 물량은 따뜻한 추출 기준이며, 아이스용 추출수와 얼음 배분은 다음 단계에서 추가합니다.`,
  ],
]);

await patch("lib/storage/integrity.ts", [
  [
    "identity import",
    `import { createCollectionStore } from "@/lib/storage/collectionStore";\n`,
    `import {\n  brewProfileIdentityKey,\n  normalizeDrinkStyle,\n} from "@/lib/brew/profileIdentity";\nimport { createCollectionStore } from "@/lib/storage/collectionStore";\n`,
  ],
  [
    "profile key",
    `function profileKey(profile: BeanBrewProfile) {\n  return [\n    profile.beanId,\n    profile.brewerType,\n    profile.grinderProfileId,\n    profile.tasteGoal,\n  ].join("|");\n}`,
    `function profileKey(profile: BeanBrewProfile) {\n  return brewProfileIdentityKey(profile);\n}`,
  ],
  [
    "normalize profiles",
    `  const storedProfiles = dedupeById(profiles.list());\n  const validProfiles = storedProfiles.filter((profile) =>\n    beanIds.has(profile.beanId),\n  );`,
    `  const storedProfiles = dedupeById(profiles.list());\n  const normalizedProfiles = storedProfiles.map((profile) => ({\n    ...profile,\n    drinkStyle: normalizeDrinkStyle(profile.drinkStyle),\n  }));\n  const validProfiles = normalizedProfiles.filter((profile) =>\n    beanIds.has(profile.beanId),\n  );`,
  ],
  [
    "session source",
    `  let removedOrphanSessions = 0;\n  let repairedSessionLinks = 0;\n  const normalizedSessions: BrewSession[] = [];\n\n  for (const session of dedupeById(sessions.list())) {`,
    `  let removedOrphanSessions = 0;\n  let repairedSessionLinks = 0;\n  const storedSessions = dedupeById(sessions.list());\n  const normalizedSessions: BrewSession[] = [];\n\n  for (const session of storedSessions) {`,
  ],
  [
    "session normalization",
    `    const needsRepair =\n      session.profileId !== canonicalProfile.id ||\n      session.beanId !== canonicalProfile.beanId;\n\n    normalizedSessions.push(\n      needsRepair\n        ? {\n            ...session,\n            profileId: canonicalProfile.id,\n            beanId: canonicalProfile.beanId,\n          }\n        : session,\n    );`,
    `    const drinkStyle = normalizeDrinkStyle(canonicalProfile.drinkStyle);\n    const needsRepair =\n      session.profileId !== canonicalProfile.id ||\n      session.beanId !== canonicalProfile.beanId ||\n      session.drinkStyle !== drinkStyle ||\n      session.recipeSnapshot.drinkStyle !== drinkStyle;\n\n    normalizedSessions.push(\n      needsRepair\n        ? {\n            ...session,\n            profileId: canonicalProfile.id,\n            beanId: canonicalProfile.beanId,\n            drinkStyle,\n            recipeSnapshot: {\n              ...session.recipeSnapshot,\n              drinkStyle,\n            },\n          }\n        : session,\n    );`,
  ],
  [
    "session changed source",
    `  const sessionChanged = !sameCollection(\n    dedupeById(sessions.list()),\n    repairedSessions,\n  );`,
    `  const sessionChanged = !sameCollection(storedSessions, repairedSessions);`,
  ],
]);

await patch("app/BrewHistoryDrawer.tsx", [
  [
    "style label import",
    `import { brewSessionDiscardedEvent } from "@/lib/brew/activeBrewDiscard";\n`,
    `import { brewSessionDiscardedEvent } from "@/lib/brew/activeBrewDiscard";\nimport { drinkStyleLabel } from "@/lib/brew/profileIdentity";\n`,
  ],
  [
    "profile style display",
    `{brewerLabels[summary.profile.brewerType]} · {summary.grinder?.displayName ?? "그라인더 미확인"} · {tasteLabels[summary.profile.tasteGoal]}`,
    `{drinkStyleLabel(summary.profile.drinkStyle)} · {brewerLabels[summary.profile.brewerType]} · {summary.grinder?.displayName ?? "그라인더 미확인"} · {tasteLabels[summary.profile.tasteGoal]}`,
  ],
]);

await patch("lib/customRecipes/currentBestCopy.ts", [
  [
    "style import",
    `import type {\n  Bean,`,
    `import {\n  drinkStyleLabel,\n  normalizeDrinkStyle,\n} from "@/lib/brew/profileIdentity";\nimport type {\n  Bean,`,
  ],
  [
    "generated style name",
    `  const method = brewerLabels[snapshot.brewerType];\n  const generatedName = \`\${bean.name} · 현재 베스트\`;\n  const notes = [`,
    `  const method = brewerLabels[snapshot.brewerType];\n  const drinkStyle = normalizeDrinkStyle(\n    session.drinkStyle ?? snapshot.drinkStyle,\n  );\n  const styleLabel = drinkStyleLabel(drinkStyle);\n  const generatedName = \`\${bean.name} · \${styleLabel} 현재 베스트\`;\n  const notes = [\n    \`음용 방식 \${styleLabel}\`,`,
  ],
  [
    "custom recipe metadata",
    `    profile: \`\${tasteLabels[session.tasteGoal]} · 현재 베스트\`,\n    tags: ["나만의 레시피", method, "현재 베스트"],`,
    `    profile: \`\${styleLabel} · \${tasteLabels[session.tasteGoal]} · 현재 베스트\`,\n    tags: ["나만의 레시피", method, styleLabel, "현재 베스트"],`,
  ],
]);
