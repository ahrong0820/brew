import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function launcherBottomClass(source) {
  const className = source.match(/className="fixed ([^"]+)"/)?.[1];
  assert.ok(className, "fixed launcher class should exist");
  const bottomClass = className
    .split(/\s+/)
    .find((token) => token.startsWith("bottom-"));
  assert.ok(bottomClass, "launcher should define a bottom position");
  return bottomClass;
}

test("desktop coffee launchers occupy unique vertical slots", async () => {
  const sources = await Promise.all([
    readProjectFile("app/BeanLibraryDrawer.tsx"),
    readProjectFile("app/RecommendationDrawerV2.tsx"),
    readProjectFile("app/GrindMicronDrawer.tsx"),
    readProjectFile("app/BrewHistoryDrawer.tsx"),
    readProjectFile("app/OriginRegionDrawer.tsx"),
  ]);

  const positions = sources.map(launcherBottomClass);
  assert.deepEqual(positions, [
    "bottom-4",
    "bottom-20",
    "bottom-36",
    "bottom-52",
    "bottom-[17rem]",
  ]);
  assert.equal(new Set(positions).size, positions.length);
});

test("mobile navigation hides the origin launcher and exposes it in tools", async () => {
  const [navigation, originDrawer] = await Promise.all([
    readProjectFile("app/MobileCoffeeNav.tsx"),
    readProjectFile("app/OriginRegionDrawer.tsx"),
  ]);

  assert.match(
    navigation,
    /{ key: "origin-region", label: "세부 산지" }/,
  );
  assert.match(navigation, /openLauncher\("origin-region"\)/);
  assert.match(navigation, /<MapPinned aria-hidden="true" size={21} \/>/);
  assert.match(navigation, /저장 원두에 지역·주·구역 정보를 추가하거나 수정합니다/);
  assert.match(originDrawer, /aria-label="세부 산지 관리 열기"/);
  assert.match(originDrawer, /세부 산지\s*<\/button>/s);
});

test("origin region launcher no longer shares the recommendation position", async () => {
  const [originDrawer, recommendationDrawer] = await Promise.all([
    readProjectFile("app/OriginRegionDrawer.tsx"),
    readProjectFile("app/RecommendationDrawerV2.tsx"),
  ]);

  assert.equal(launcherBottomClass(originDrawer), "bottom-[17rem]");
  assert.equal(launcherBottomClass(recommendationDrawer), "bottom-20");
  assert.notEqual(
    launcherBottomClass(originDrawer),
    launcherBottomClass(recommendationDrawer),
  );
});
