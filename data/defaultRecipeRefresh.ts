import { anstarDefaultRecipe } from "./anstarDefaultRecipe";
import { clever111 } from "./clever111";
import { jisVer2Default } from "./jisVer2Default";
import { recipe484 } from "./recipe484";
import { tetsuDefault } from "./tetsuDefault";

export const refreshedDefaultRecipes = [
  anstarDefaultRecipe,
  clever111,
  jisVer2Default,
  recipe484,
  tetsuDefault,
];

export const removedDefaultRecipeIds = new Set([
  "signature-cone",
  "deepblue-v60",
  "jis-4666",
  "jis-clever-112",
]);

export const preferredDefaultRecipeOrder = [
  "tetsu-46",
  "tetsu-neo-2026",
  "anstar-6888",
  "jis-ver2-hot",
  "jis-484-15g-2026",
  "yong-light",
  "switch-devil",
  "hoffmann-clever-water-first",
  "jis-clever-1-11",
];
