import { readFile, writeFile } from "node:fs/promises";

const pagePath = "app/page.tsx";
let source = await readFile(pagePath, "utf8");

function replaceOnce(search, replacement, label) {
  const matches = source.split(search).length - 1;
  if (matches !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${matches}`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import { useEffect, useMemo, useRef, useState } from "react";\nimport {\n  recommendationTimerStartEvent,',
  'import { useEffect, useMemo, useRef, useState } from "react";\nimport {\n  clearBrewSessionClock,\n  getBrewSessionElapsedSeconds,\n  pauseBrewSessionClock,\n  readBrewSessionClock,\n  resetBrewSessionClock,\n  resumeBrewSessionClock,\n  seekBrewSessionClock,\n  startBrewSessionClock,\n  subscribeToBrewSessionClock,\n  type BrewSessionClock,\n} from "@/lib/timer/brewSessionClock";\nimport {\n  recommendationTimerStartEvent,',
  "shared clock imports",
);

replaceOnce(
  '  const [dose, setDose] = useState(recipes[0].dose);\n  const [elapsed, setElapsed] = useState(0);\n  const [running, setRunning] = useState(false);\n  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);',
  '  const [dose, setDose] = useState(recipes[0].dose);\n  const [timerClock, setTimerClock] = useState<BrewSessionClock | null>(null);\n  const [clockNow, setClockNow] = useState(0);\n  const [timerNotice, setTimerNotice] = useState<string | null>(null);\n  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);',
  "timer state",
);

replaceOnce(
  '  const [storageLoaded, setStorageLoaded] = useState(false);\n  const elapsedRef = useRef(0);\n  const lastTickRef = useRef<number | null>(null);\n  const previousStepIndexRef = useRef(0);',
  '  const [storageLoaded, setStorageLoaded] = useState(false);\n  const previousElapsedRef = useRef(0);\n  const previousStepIndexRef = useRef(0);',
  "timer refs",
);

replaceOnce(
  '  const totalTime = selectedRecipe.totalTime;\n\n  const filteredRecipes = useMemo(() => {',
  '  const totalTime = selectedRecipe.totalTime;\n  const elapsed = getBrewSessionElapsedSeconds(timerClock, clockNow);\n  const running = timerClock?.status === "running";\n\n  const filteredRecipes = useMemo(() => {',
  "derived timer state",
);

replaceOnce(
  `  useEffect(() => {\n    if (!running) {\n      lastTickRef.current = null;\n      return;\n    }\n\n    lastTickRef.current = Date.now();\n    const intervalId = window.setInterval(() => {\n      const now = Date.now();\n      const lastTick = lastTickRef.current ?? now;\n      const delta = (now - lastTick) / 1000;\n      lastTickRef.current = now;\n\n      const nextElapsed = Math.min(totalTime, elapsedRef.current + delta);\n\n      if (\n        elapsedRef.current < totalTime &&\n        nextElapsed >= totalTime &&\n        !completionPlayedRef.current\n      ) {\n        completionPlayedRef.current = true;\n\n        if (alertsEnabled) {\n          runSmartAlert();\n        }\n      }\n\n      elapsedRef.current = nextElapsed;\n      setElapsed(nextElapsed);\n\n      if (nextElapsed >= totalTime) {\n        setRunning(false);\n      }\n    }, 200);\n\n    return () => window.clearInterval(intervalId);\n  }, [alertsEnabled, running, totalTime]);`,
  `  useEffect(() => {\n    function applyClock(nextClock: BrewSessionClock | null) {\n      setTimerClock(nextClock);\n      setClockNow(Date.now());\n\n      if (nextClock?.recipe) {\n        if (nextClock.recipe.id.startsWith("recommendation-")) {\n          setRecommendedRecipe(nextClock.recipe as Recipe);\n        }\n        setSelectedId(nextClock.recipe.id);\n        setDose(nextClock.recipe.dose);\n      }\n    }\n\n    const timeoutId = window.setTimeout(() => {\n      applyClock(readBrewSessionClock());\n    }, 0);\n    const unsubscribe = subscribeToBrewSessionClock(applyClock);\n\n    return () => {\n      window.clearTimeout(timeoutId);\n      unsubscribe();\n    };\n  }, []);\n\n  useEffect(() => {\n    if (!running) {\n      return;\n    }\n\n    const intervalId = window.setInterval(() => setClockNow(Date.now()), 200);\n    return () => window.clearInterval(intervalId);\n  }, [running]);\n\n  useEffect(() => {\n    if (elapsed < totalTime) {\n      completionPlayedRef.current = false;\n    }\n\n    if (\n      running &&\n      previousElapsedRef.current < totalTime &&\n      elapsed >= totalTime &&\n      !completionPlayedRef.current\n    ) {\n      completionPlayedRef.current = true;\n      if (alertsEnabled) {\n        runSmartAlert();\n      }\n    }\n\n    previousElapsedRef.current = elapsed;\n  }, [alertsEnabled, elapsed, running, totalTime]);`,
  "timer effects",
);

replaceOnce(
  `      setRecommendedRecipe(detail.recipe);\n      setSelectedId(detail.recipe.id);\n      setDose(detail.recipe.dose);\n      completionPlayedRef.current = false;\n      elapsedRef.current = 0;\n      setElapsed(0);\n      setRunning(true);`,
  `      setRecommendedRecipe(detail.recipe);\n      setSelectedId(detail.recipe.id);\n      setDose(detail.recipe.dose);\n      setTimerClock(readBrewSessionClock());\n      setClockNow(Date.now());\n      setTimerNotice(null);\n      completionPlayedRef.current = false;\n      previousElapsedRef.current = 0;`,
  "recommendation start handler",
);

replaceOnce(
  `  function updateElapsed(nextElapsed: number) {\n    if (nextElapsed < totalTime) {\n      completionPlayedRef.current = false;\n    }\n\n    elapsedRef.current = nextElapsed;\n    setElapsed(nextElapsed);\n  }\n\n  function selectRecipe(recipe: Recipe) {\n    setSelectedId(recipe.id);\n    setDose(recipe.dose);\n    updateElapsed(0);\n    setRunning(false);\n  }`,
  `  function isDifferentTrackedRecipe(\n    clock: BrewSessionClock | null,\n    recipe: Recipe,\n  ) {\n    return Boolean(\n      clock?.sessionId &&\n        clock.status !== "completed" &&\n        clock.recipe?.id !== recipe.id,\n    );\n  }\n\n  function toggleTimer() {\n    const now = Date.now();\n    const current = readBrewSessionClock();\n\n    if (isDifferentTrackedRecipe(current, selectedRecipe)) {\n      setTimerNotice("진행 중인 추천 추출을 완료한 뒤 다른 레시피를 시작해 주세요.");\n      return;\n    }\n\n    if (!current || current.recipe?.id !== selectedRecipe.id || current.status === "completed") {\n      startBrewSessionClock({ recipe: selectedRecipe }, now);\n    } else if (current.status === "running") {\n      pauseBrewSessionClock(now);\n    } else {\n      resumeBrewSessionClock(now);\n    }\n\n    setTimerNotice(null);\n  }\n\n  function updateElapsed(nextElapsed: number) {\n    const now = Date.now();\n    let current = readBrewSessionClock();\n\n    if (isDifferentTrackedRecipe(current, selectedRecipe)) {\n      setTimerNotice("진행 중인 추천 추출에서는 현재 레시피의 단계만 이동할 수 있습니다.");\n      return;\n    }\n\n    if (!current || current.recipe?.id !== selectedRecipe.id || current.status === "completed") {\n      startBrewSessionClock({ recipe: selectedRecipe }, now);\n      current = pauseBrewSessionClock(now);\n    }\n\n    seekBrewSessionClock(nextElapsed, now);\n    setTimerNotice(null);\n    if (nextElapsed < totalTime) {\n      completionPlayedRef.current = false;\n    }\n  }\n\n  function selectRecipe(recipe: Recipe) {\n    const current = readBrewSessionClock();\n    if (isDifferentTrackedRecipe(current, recipe)) {\n      setTimerNotice("진행 중인 추천 추출을 완료한 뒤 다른 레시피를 선택해 주세요.");\n      document.getElementById("brew-timer-panel")?.scrollIntoView({\n        behavior: "smooth",\n        block: "start",\n      });\n      return;\n    }\n\n    clearBrewSessionClock();\n    setSelectedId(recipe.id);\n    setDose(recipe.dose);\n    setTimerNotice(null);\n    completionPlayedRef.current = false;\n    previousElapsedRef.current = 0;\n  }`,
  "timer controls",
);

replaceOnce(
  `    setFilter("나만의 레시피");\n    updateElapsed(0);\n    setRunning(false);`,
  `    setFilter("나만의 레시피");\n    clearBrewSessionClock();\n    setTimerNotice(null);\n    completionPlayedRef.current = false;\n    previousElapsedRef.current = 0;`,
  "custom recipe timer reset",
);

replaceOnce(
  `  function resetTimer() {\n    updateElapsed(0);\n    setRunning(false);\n  }`,
  `  function resetTimer() {\n    resetBrewSessionClock();\n    setTimerNotice(null);\n    completionPlayedRef.current = false;\n    previousElapsedRef.current = 0;\n  }`,
  "reset timer",
);

replaceOnce(
  `    updateElapsed(totalTime);\n    setRunning(false);`,
  `    updateElapsed(totalTime);`,
  "next step completion",
);

replaceOnce(
  '                  onClick={() => setRunning((current) => !current)}',
  '                  onClick={toggleTimer}',
  "timer toggle button",
);

replaceOnce(
  `              </div>\n            </div>\n\n            <div className="mt-3 grid grid-cols-2 gap-2">`,
  `              </div>\n              {timerNotice && (\n                <p className="mt-3 rounded-md bg-[#fff3df] px-3 py-2 text-xs leading-5 text-[#805526]">\n                  {timerNotice}\n                </p>\n              )}\n            </div>\n\n            <div className="mt-3 grid grid-cols-2 gap-2">`,
  "timer notice",
);

await writeFile(pagePath, source);
