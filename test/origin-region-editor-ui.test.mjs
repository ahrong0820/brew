import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("origin region editor is mounted and uses the shared bean storage model", async () => {
  const [component, layout] = await Promise.all([
    readProjectFile("app/OriginRegionDrawer.tsx"),
    readProjectFile("app/layout.tsx"),
  ]);

  assert.match(component, /from "@\/lib\/domain\/originRegions"/);
  assert.match(component, /parseOriginRegionInput/);
  assert.match(component, /formatOriginRegionInput/);
  assert.match(component, /beanStore\.upsert/);
  assert.match(component, /withUpdatedTimestamp/);
  assert.match(component, /originRegions/);
  assert.match(component, /철자와 별칭은 자동으로/);
  assert.match(component, /Guji, Hambela Wamena/);
  assert.match(layout, /import OriginRegionDrawer from "\.\/OriginRegionDrawer"/);
  assert.match(layout, /<OriginRegionDrawer \/>/);
});

test("origin region editor does not import recommendation calculation modules", async () => {
  const component = await readProjectFile("app/OriginRegionDrawer.tsx");

  assert.equal(component.includes("@/lib/recommendation"), false);
  assert.equal(component.includes("candidateRules"), false);
  assert.equal(component.includes("activeRules"), false);
});

test("origin region editor supports clearing the optional field", async () => {
  const component = await readProjectFile("app/OriginRegionDrawer.tsx");

  assert.match(
    component,
    /const originRegions = parseOriginRegionInput\(drafts\[bean\.id\] \?\? ""\)/,
  );
  assert.match(component, /\.\.\.bean,\s+originRegions,/s);
});
