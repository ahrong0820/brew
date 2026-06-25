import { readFile, writeFile } from "node:fs/promises";

const path = "lib/timer/brewSessionClock.ts";
let source = await readFile(path, "utf8");

function replaceOnce(search, replacement, label) {
  const matches = source.split(search).length - 1;
  if (matches !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${matches}`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  `interface StartBrewSessionClockInput {\n  recipe: TimerRecipe;\n  sessionId?: string;\n  isFirstSession?: boolean;\n}\n`,
  `interface StartBrewSessionClockInput {\n  recipe: TimerRecipe;\n  sessionId?: string;\n  isFirstSession?: boolean;\n}\n\nlet inMemoryClock: BrewSessionClock | null = null;\n`,
  "memory clock declaration",
);

replaceOnce(
  `function persistClock(clock: BrewSessionClock | null) {\n  if (typeof window === "undefined") {\n    return clock;\n  }\n\n  try {`,
  `function persistClock(clock: BrewSessionClock | null) {\n  inMemoryClock = clock;\n\n  if (typeof window === "undefined") {\n    return clock;\n  }\n\n  try {`,
  "persist memory clock",
);

replaceOnce(
  `    const raw = window.sessionStorage.getItem(activeBrewSessionStorageKey);\n    if (!raw) {\n      return null;\n    }`,
  `    const raw = window.sessionStorage.getItem(activeBrewSessionStorageKey);\n    if (!raw) {\n      return inMemoryClock;\n    }`,
  "empty storage fallback",
);

replaceOnce(
  `    if (!clock) {\n      window.sessionStorage.removeItem(activeBrewSessionStorageKey);\n    }\n\n    return clock;\n  } catch {\n    window.sessionStorage.removeItem(activeBrewSessionStorageKey);\n    return null;\n  }`,
  `    if (!clock) {\n      inMemoryClock = null;\n      window.sessionStorage.removeItem(activeBrewSessionStorageKey);\n      return null;\n    }\n\n    inMemoryClock = clock;\n    return clock;\n  } catch {\n    return inMemoryClock;\n  }`,
  "read memory fallback",
);

await writeFile(path, source);
