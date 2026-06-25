import { readFile, writeFile } from "node:fs/promises";

const path = "app/RecommendationDrawer.tsx";
const source = await readFile(path, "utf8");
const search = `        grinder: selectedGrinder,\n        brewerType: preferences.defaultBrewer,\n        tasteGoal,`;
const replacement = `        grinder: selectedGrinder,\n        brewerType: preferences.defaultBrewer,\n        drinkStyle: preferences.defaultDrinkStyle,\n        tasteGoal,`;
const matches = source.split(search).length - 1;

if (matches !== 1) {
  throw new Error(`expected one legacy recommendation launch call, found ${matches}`);
}

await writeFile(path, source.replace(search, replacement));
