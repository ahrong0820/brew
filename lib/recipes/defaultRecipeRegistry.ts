import { anstarDefaultRecipe } from "../../data/anstarDefaultRecipe.ts";
import { clever111 } from "../../data/clever111.ts";
import {
  hoffmannCleverDefaultRecipe,
  switchDevilDefaultRecipe,
  tetsu46DefaultRecipe,
  yongLightDefaultRecipe,
} from "../../data/defaultRecipeDefinitions.ts";
import { jisV60FourServingHot } from "../../data/jisV60FourServingHot.ts";
import { jisVer2Default } from "../../data/jisVer2Default.ts";
import { recipe484 } from "../../data/recipe484.ts";
import { tetsuDefault } from "../../data/tetsuDefault.ts";
import {
  yongNeoReverseSwitchHot,
  yongNeoReverseSwitchIce,
} from "../../data/yongNeoSwitchDefault.ts";
import type { Recipe } from "../types/defaultRecipe.ts";

export const defaultRecipeCatalogVersion = "2026-08-31.1" as const;

export type DefaultRecipeRegistryEntry = Readonly<{
  recipe: Recipe;
  requiredForDeploy?: boolean;
  aliases?: readonly string[];
}>;

export type RemovedDefaultRecipe = Readonly<{
  id: string;
  name: string;
}>;

export const defaultRecipeRegistry: readonly DefaultRecipeRegistryEntry[] = [
  { recipe: tetsu46DefaultRecipe },
  { recipe: tetsuDefault, requiredForDeploy: true },
  {
    recipe: anstarDefaultRecipe,
    requiredForDeploy: true,
    aliases: ["anstar-multiserve-20g-2024"],
  },
  { recipe: jisVer2Default, requiredForDeploy: true },
  { recipe: jisV60FourServingHot, requiredForDeploy: true },
  { recipe: recipe484, requiredForDeploy: true },
  { recipe: yongLightDefaultRecipe },
  { recipe: yongNeoReverseSwitchHot, requiredForDeploy: true },
  { recipe: yongNeoReverseSwitchIce, requiredForDeploy: true },
  { recipe: switchDevilDefaultRecipe },
  { recipe: hoffmannCleverDefaultRecipe },
  { recipe: clever111, requiredForDeploy: true },
];

export const removedDefaultRecipeHistory: readonly RemovedDefaultRecipe[] = [
  { id: "signature-cone", name: "시그니쳐 로스터스 콘 필터" },
  { id: "deepblue-v60", name: "딥블루레이크 V60 HOT" },
  { id: "jis-4666", name: "정인성 4666 오리지널" },
  { id: "jis-clever-112", name: "정인성 클레버 1:12" },
];

export const defaultRecipes = defaultRecipeRegistry.map(({ recipe }) => recipe);

export const defaultRecipeCatalogEntries = defaultRecipeRegistry.map(({ recipe }) => ({
  id: recipe.id,
  name: recipe.name,
}));

export const preferredDefaultRecipeOrder = defaultRecipeRegistry.map(
  ({ recipe }) => recipe.id,
);

export const requiredDefaultRecipeNames = defaultRecipeRegistry
  .filter((entry) => entry.requiredForDeploy)
  .map(({ recipe }) => recipe.name);

export const defaultRecipeIdAliases = Object.fromEntries(
  defaultRecipeRegistry.flatMap((entry) =>
    (entry.aliases ?? []).map((alias) => [alias, entry.recipe.id] as const),
  ),
) as Readonly<Record<string, string>>;

export const removedDefaultRecipeIds = removedDefaultRecipeHistory.map(
  ({ id }) => id,
);

export const removedDefaultRecipeNames = removedDefaultRecipeHistory.map(
  ({ name }) => name,
);

function assertUnique(values: readonly string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate ${label}: ${[...new Set(duplicates)].join(", ")}`);
  }
}

function validateDefaultRecipeRegistry() {
  const activeIds = defaultRecipes.map(({ id }) => id);
  const activeNames = defaultRecipes.map(({ name }) => name);
  const aliasEntries = Object.entries(defaultRecipeIdAliases);

  assertUnique(activeIds, "default recipe id");
  assertUnique(activeNames, "default recipe name");
  assertUnique(removedDefaultRecipeIds, "removed default recipe id");
  assertUnique(removedDefaultRecipeNames, "removed default recipe name");

  const activeIdSet = new Set(activeIds);
  const removedIdSet = new Set(removedDefaultRecipeIds);
  for (const [alias, target] of aliasEntries) {
    if (activeIdSet.has(alias) || removedIdSet.has(alias)) {
      throw new Error(`Default recipe alias collides with another recipe id: ${alias}`);
    }
    if (!activeIdSet.has(target)) {
      throw new Error(`Default recipe alias target is not active: ${alias} -> ${target}`);
    }
  }
}

validateDefaultRecipeRegistry();
