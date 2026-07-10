import assert from "node:assert/strict";
import test from "node:test";
import { migrateDefaultRecipeClientStorage } from "./defaultRecipeStorageMigration.ts";

class MemoryStorage {
  #items = new Map<string, string>();

  getItem(key: string) {
    return this.#items.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.#items.set(key, value);
  }

  removeItem(key: string) {
    this.#items.delete(key);
  }

  json(key: string) {
    const value = this.getItem(key);
    return value ? JSON.parse(value) as unknown : null;
  }
}

test("storage migration removes deleted favorites and canonicalizes aliased recipe ids", () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  localStorage.setItem(
    "coffee-recipe-favorites",
    JSON.stringify([
      "jis-4666",
      "anstar-multiserve-20g-2024",
      "anstar-6888",
      "custom-1",
    ]),
  );

  const report = migrateDefaultRecipeClientStorage({ localStorage, sessionStorage });

  assert.equal(report.changed, true);
  assert.deepEqual(localStorage.json("coffee-recipe-favorites"), [
    "anstar-6888",
    "custom-1",
  ]);
});

test("storage migration removes stale custom entries and clears deleted active sessions", () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  localStorage.setItem(
    "coffee-custom-recipes",
    JSON.stringify([
      {
        id: "custom-1",
        name: "saved",
        origin: "나만의 레시피",
        method: "V60",
        profile: "balanced",
        tags: ["나만의 레시피"],
        dose: 20,
        water: 300,
        ratio: "1:15",
        temp: "92℃",
        grind: "medium",
        totalTime: 60,
        notes: [],
        steps: [{ label: "brew", start: 0, end: 60, targetWater: 300, cue: "pour" }],
      },
      { id: "jis-clever-112", name: "정인성 클레버 1:12" },
    ]),
  );
  sessionStorage.setItem(
    "brew.activeRecommendationSession.v1",
    JSON.stringify({
      version: 2,
      recipeName: "정인성 4666 오리지널",
      targetTimeSeconds: 160,
      status: "running",
      elapsedSeconds: 0,
      runningSince: 1,
      updatedAt: 1,
    }),
  );

  const report = migrateDefaultRecipeClientStorage({ localStorage, sessionStorage });

  assert.equal(report.removedCustomRecipeEntries, 1);
  assert.equal(report.clearedActiveSession, true);
  const storedCustomRecipes = localStorage.json("coffee-custom-recipes") as Array<{ id: string }>;
  assert.deepEqual(storedCustomRecipes.map((recipe) => recipe.id), ["custom-1"]);
  assert.equal(sessionStorage.getItem("brew.activeRecommendationSession.v1"), null);
});

test("storage migration canonicalizes sourceRecipeId in profile state", () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  localStorage.setItem(
    "brew.beanBrewProfiles.v1",
    JSON.stringify({
      version: 1,
      updatedAt: "2026-01-01T00:00:00.000Z",
      items: [
        { id: "profile-1", sourceRecipeId: "anstar-multiserve-20g-2024" },
        { id: "profile-2", sourceRecipeId: "jis-clever-112" },
      ],
    }),
  );

  const report = migrateDefaultRecipeClientStorage({ localStorage, sessionStorage });
  const migrated = localStorage.json("brew.beanBrewProfiles.v1") as {
    items: Array<{ id: string; sourceRecipeId?: string }>;
  };

  assert.equal(report.migratedProfileRecipeIds, 1);
  assert.equal(report.clearedProfileRecipeIds, 1);
  assert.equal(migrated.items[0]?.sourceRecipeId, "anstar-6888");
  assert.equal("sourceRecipeId" in migrated.items[1], false);
});

test("malformed JSON is cleared per key without blocking later migrations", () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  localStorage.setItem("coffee-recipe-favorites", "{broken");
  localStorage.setItem(
    "brew.beanBrewProfiles.v1",
    JSON.stringify({
      version: 1,
      items: [{ id: "profile-1", sourceRecipeId: "anstar-multiserve-20g-2024" }],
    }),
  );

  const report = migrateDefaultRecipeClientStorage({ localStorage, sessionStorage });
  const profiles = localStorage.json("brew.beanBrewProfiles.v1") as {
    items: Array<{ sourceRecipeId?: string }>;
  };

  assert.equal(localStorage.getItem("coffee-recipe-favorites"), null);
  assert.deepEqual(report.clearedMalformedKeys, ["coffee-recipe-favorites"]);
  assert.equal(profiles.items[0]?.sourceRecipeId, "anstar-6888");
  assert.equal(report.migratedProfileRecipeIds, 1);
});

test("a write failure for one key does not stop unrelated storage migrations", () => {
  class SelectiveFailureStorage extends MemoryStorage {
    override setItem(key: string, value: string) {
      if (key === "coffee-recipe-favorites" && this.getItem(key) !== null) {
        throw new Error("quota exceeded");
      }
      super.setItem(key, value);
    }
  }

  const localStorage = new SelectiveFailureStorage();
  const sessionStorage = new MemoryStorage();
  localStorage.setItem("coffee-recipe-favorites", JSON.stringify(["jis-4666"]));
  localStorage.setItem(
    "brew.beanBrewProfiles.v1",
    JSON.stringify({
      version: 1,
      items: [{ id: "profile-1", sourceRecipeId: "anstar-multiserve-20g-2024" }],
    }),
  );

  const report = migrateDefaultRecipeClientStorage({ localStorage, sessionStorage });
  const profiles = localStorage.json("brew.beanBrewProfiles.v1") as {
    items: Array<{ sourceRecipeId?: string }>;
  };

  assert.ok(report.failedKeys.includes("coffee-recipe-favorites"));
  assert.equal(profiles.items[0]?.sourceRecipeId, "anstar-6888");
});

test("storage migration is idempotent after successful repair", () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  localStorage.setItem(
    "coffee-recipe-favorites",
    JSON.stringify(["anstar-multiserve-20g-2024", "jis-4666"]),
  );

  const first = migrateDefaultRecipeClientStorage({ localStorage, sessionStorage });
  const second = migrateDefaultRecipeClientStorage({ localStorage, sessionStorage });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.deepEqual(second.clearedMalformedKeys, []);
  assert.deepEqual(second.failedKeys, []);
});
