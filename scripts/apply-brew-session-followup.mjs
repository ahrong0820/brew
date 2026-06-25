import { readFile, writeFile } from "node:fs/promises";

async function replaceOnce(path, search, replacement, label) {
  const source = await readFile(path, "utf8");
  const matches = source.split(search).length - 1;
  if (matches !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${matches}`);
  }
  await writeFile(path, source.replace(search, replacement));
}

await replaceOnce(
  "lib/timer/brewSessionClock.ts",
  `  try {\n    if (clock) {\n      window.sessionStorage.setItem(\n        activeBrewSessionStorageKey,\n        JSON.stringify(clock),\n      );\n    } else {\n      window.sessionStorage.removeItem(activeBrewSessionStorageKey);\n    }\n  } finally {\n    emitClockChange(clock);\n  }`,
  `  try {\n    if (clock) {\n      window.sessionStorage.setItem(\n        activeBrewSessionStorageKey,\n        JSON.stringify(clock),\n      );\n    } else {\n      window.sessionStorage.removeItem(activeBrewSessionStorageKey);\n    }\n  } catch {\n    // 저장소를 사용할 수 없어도 현재 탭의 타이머 상태는 계속 동기화합니다.\n  } finally {\n    emitClockChange(clock);\n  }`,
  "storage fallback",
);

await replaceOnce(
  "app/page.tsx",
  `  function saveCustomRecipe() {\n    const safeDose = clampNumber(draftDose, 8, 60);`,
  `  function saveCustomRecipe() {\n    const activeClock = readBrewSessionClock();\n    if (activeClock?.sessionId && activeClock.status !== "completed") {\n      setTimerNotice(\n        "진행 중인 추천 추출을 완료한 뒤 나만의 레시피를 저장해 주세요.",\n      );\n      document.getElementById("brew-timer-panel")?.scrollIntoView({\n        behavior: "smooth",\n        block: "start",\n      });\n      return;\n    }\n\n    const safeDose = clampNumber(draftDose, 8, 60);`,
  "custom recipe guard",
);

await replaceOnce(
  "app/page.tsx",
  `    let current = readBrewSessionClock();`,
  `    const current = readBrewSessionClock();`,
  "const current clock",
);

await replaceOnce(
  "app/page.tsx",
  `      startBrewSessionClock({ recipe: selectedRecipe }, now);\n      current = pauseBrewSessionClock(now);`,
  `      startBrewSessionClock({ recipe: selectedRecipe }, now);\n      pauseBrewSessionClock(now);`,
  "unused clock assignment",
);
