import assert from "node:assert/strict";
import test from "node:test";

import { createBean } from "../lib/domain/factories.ts";
import { normalizeOriginRegions } from "../lib/domain/originRegions.ts";
import { isCompatibleBean } from "../lib/storage/beanGuard.ts";

const timestamp = "2026-06-26T00:00:00.000Z";

const legacyBean = {
  id: "bean-legacy",
  name: "Legacy bean",
  originCountry: "ethiopia",
  originGroup: "east-africa",
  roastLevel: "light",
  process: "washed",
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("legacy beans without originRegions remain compatible", () => {
  assert.equal(isCompatibleBean(legacyBean), true);
});

test("bean storage accepts string region arrays and rejects malformed values", () => {
  assert.equal(
    isCompatibleBean({
      ...legacyBean,
      originRegions: ["Guji", "Sidama"],
    }),
    true,
  );
  assert.equal(
    isCompatibleBean({
      ...legacyBean,
      originRegions: "Guji",
    }),
    false,
  );
  assert.equal(
    isCompatibleBean({
      ...legacyBean,
      originRegions: ["Guji", 42],
    }),
    false,
  );
});

test("origin region normalization trims, removes blanks and preserves first occurrence order", () => {
  assert.deepEqual(
    normalizeOriginRegions([" Guji ", "Sidama", "Guji", "", "  "]),
    ["Guji", "Sidama"],
  );
  assert.equal(normalizeOriginRegions(["", "  "]), undefined);
  assert.equal(normalizeOriginRegions(undefined), undefined);
});

test("createBean stores normalized origin regions without changing recommendation fields", () => {
  const bean = createBean(
    {
      name: " Regional lot ",
      originCountry: "ethiopia",
      originGroup: "east-africa",
      originRegions: [" Guji ", "Sidama", "Guji"],
      roastLevel: "light",
      process: "natural",
    },
    timestamp,
  );

  assert.equal(bean.name, "Regional lot");
  assert.deepEqual(bean.originRegions, ["Guji", "Sidama"]);
  assert.equal(bean.originCountry, "ethiopia");
  assert.equal(bean.originGroup, "east-africa");
  assert.equal(bean.roastLevel, "light");
  assert.equal(bean.process, "natural");
});
