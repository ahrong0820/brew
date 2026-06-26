import assert from "node:assert/strict";
import test from "node:test";

import {
  formatOriginRegionInput,
  isCompatibleOriginRegions,
  normalizeOriginRegions,
  parseOriginRegionInput,
} from "../lib/domain/originRegions.ts";

test("missing originRegions remains compatible for legacy beans", () => {
  assert.equal(isCompatibleOriginRegions(undefined), true);
});

test("origin region compatibility accepts string arrays and rejects malformed values", () => {
  assert.equal(isCompatibleOriginRegions(["Guji", "Sidama"]), true);
  assert.equal(isCompatibleOriginRegions([]), true);
  assert.equal(isCompatibleOriginRegions("Guji"), false);
  assert.equal(isCompatibleOriginRegions(["Guji", 42]), false);
});

test("origin region normalization trims, removes blanks and preserves first occurrence order", () => {
  assert.deepEqual(
    normalizeOriginRegions([" Guji ", "Sidama", "Guji", "", "  "]),
    ["Guji", "Sidama"],
  );
  assert.equal(normalizeOriginRegions(["", "  "]), undefined);
  assert.equal(normalizeOriginRegions(undefined), undefined);
});

test("origin region input supports comma and newline separated values", () => {
  assert.deepEqual(
    parseOriginRegionInput(" Guji, Sidama\nGuji,  "),
    ["Guji", "Sidama"],
  );
  assert.equal(parseOriginRegionInput(" ,\n  "), undefined);
});

test("origin region input formatting is reversible for normalized labels", () => {
  assert.equal(formatOriginRegionInput(["Guji", "Sidama"]), "Guji, Sidama");
  assert.equal(formatOriginRegionInput(undefined), "");
  assert.deepEqual(
    parseOriginRegionInput(formatOriginRegionInput(["Guji", "Sidama"])),
    ["Guji", "Sidama"],
  );
});
