import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const provider = await readFile(
  new URL("../app/CoffeeToolProvider.tsx", import.meta.url),
  "utf8",
);
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

const toolFiles = [
  ["recommendation", "RecommendationDrawerV2.tsx"],
  ["beans", "BeanLibraryDrawer.tsx"],
  ["origin-region", "OriginRegionDrawer.tsx"],
  ["history", "BrewHistoryDrawer.tsx"],
  ["grind", "GrindMicronDrawer.tsx"],
  ["recipe-order", "RecipeOrderDrawer.tsx"],
  ["evidence", "RecommendationEvidenceStatus.tsx"],
  ["personal-recipes", "PersonalRecipeVersionDrawer.tsx"],
];

test("coffee tools share one activeTool owner", async () => {
  assert.match(provider, /const \[activeTool, setActiveTool\] = useState<CoffeeTool \| null>\(null\)/);
  assert.match(provider, /openTool = useCallback/);
  assert.match(provider, /closeTool = useCallback/);
  assert.match(provider, /export function useCoffeeToolOpen/);
  assert.match(layout, /<CoffeeToolProvider>/);
  assert.match(layout, /<MobileCoffeeNav \/>/);

  for (const [tool, filename] of toolFiles) {
    const source = await readFile(new URL(`../app/${filename}`, import.meta.url), "utf8");
    assert.match(source, /useCoffeeToolOpen/);
    assert.ok(
      source.includes(`useCoffeeToolOpen("${tool}")`),
      `${filename} must bind to ${tool}`,
    );
    assert.match(source, /data-coffee-tool-launcher="true"/);
  }
});
