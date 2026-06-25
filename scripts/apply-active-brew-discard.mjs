import { readFile, writeFile } from "node:fs/promises";

async function patch(path, replacements) {
  let source = await readFile(path, "utf8");

  for (const [label, search, replacement] of replacements) {
    const matches = source.split(search).length - 1;
    if (matches !== 1) {
      throw new Error(`${path} ${label}: expected one match, found ${matches}`);
    }
    source = source.replace(search, replacement);
  }

  await writeFile(path, source);
}

await patch("lib/brew/sessionManagement.ts", [
  [
    "clock imports",
    'import { detachCustomRecipesFromSession } from "@/lib/customRecipes/sourceLinks";\n',
    'import { detachCustomRecipesFromSession } from "@/lib/customRecipes/sourceLinks";\nimport {\n  clearBrewSessionClock,\n  readBrewSessionClock,\n} from "@/lib/timer/brewSessionClock";\n',
  ],
  [
    "active clock cleanup",
    `  if (typeof window !== "undefined") {\n    try {\n      const key = "brew.activeRecommendationSession.v1";\n      const raw = window.sessionStorage.getItem(key);\n      const parsed = raw ? (JSON.parse(raw) as { sessionId?: unknown }) : null;\n      if (parsed?.sessionId === session.id) {\n        window.sessionStorage.removeItem(key);\n      }\n    } catch {\n      window.sessionStorage.removeItem("brew.activeRecommendationSession.v1");\n    }\n  }`,
    `  const activeClock = readBrewSessionClock();\n  if (activeClock?.sessionId === session.id) {\n    clearBrewSessionClock();\n  }`,
  ],
]);

await patch("lib/brew/activeBrewDiscard.ts", [
  [
    "remove redundant clear import",
    `import {\n  clearBrewSessionClock,\n  readBrewSessionClock,\n} from "@/lib/timer/brewSessionClock";`,
    `import { readBrewSessionClock } from "@/lib/timer/brewSessionClock";`,
  ],
  [
    "remove redundant clear call",
    `  const result = deleteBrewSessionRecord(sessionId);\n  clearBrewSessionClock();`,
    `  const result = deleteBrewSessionRecord(sessionId);`,
  ],
]);

await patch("app/BrewSessionFeedbackTracker.tsx", [
  [
    "trash icon",
    'import { Check, Coffee, Save, Timer, X } from "lucide-react";',
    'import { Check, Coffee, Save, Timer, Trash2, X } from "lucide-react";',
  ],
  [
    "discard import",
    'import { useEffect, useMemo, useState } from "react";\n',
    'import { useEffect, useMemo, useState } from "react";\nimport { discardActiveBrewSession } from "@/lib/brew/activeBrewDiscard";\n',
  ],
  [
    "discard state",
    '  const [message, setMessage] = useState<string | null>(null);\n',
    '  const [message, setMessage] = useState<string | null>(null);\n  const [discardOpen, setDiscardOpen] = useState(false);\n  const [discarding, setDiscarding] = useState(false);\n',
  ],
  [
    "discard functions",
    `  function saveFeedback() {`,
    `  function requestDiscard() {\n    setMessage(null);\n    setDiscardOpen(true);\n  }\n\n  function closeDiscard() {\n    if (!discarding) {\n      setDiscardOpen(false);\n      setMessage(null);\n    }\n  }\n\n  function confirmDiscard() {\n    if (!active?.sessionId || discarding) {\n      return;\n    }\n\n    setDiscarding(true);\n    setMessage(null);\n\n    try {\n      discardActiveBrewSession(active.sessionId);\n      setDiscardOpen(false);\n      setCompleted(null);\n      setTastingResult(null);\n      setNote("");\n    } catch (error) {\n      setMessage(\n        error instanceof Error\n          ? error.message\n          : "진행 중인 추출을 폐기하지 못했습니다.",\n      );\n    } finally {\n      setDiscarding(false);\n    }\n  }\n\n  function saveFeedback() {`,
  ],
  [
    "active controls",
    `          <div className="mt-3 flex items-center justify-between gap-3">\n            <p className="text-xs leading-5 text-white/75">\n              {active.status === "paused"\n                ? "메인 타이머에서 다시 시작하면 실제 시간 측정도 함께 재개됩니다."\n                : targetReached\n                  ? "목표 시간을 지났습니다. 드로다운이 끝나면 완료를 누르세요."\n                  : "드로다운이 끝나는 시점에 완료를 누르세요."}\n            </p>\n            <button\n              type="button"\n              onClick={finishBrew}\n              className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#173d34] transition hover:bg-[#e9f2ed] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#173d34]"\n            >\n              <Check aria-hidden="true" size={17} />\n              추출 완료\n            </button>\n          </div>`,
    `          <div className="mt-3">\n            <p className="text-xs leading-5 text-white/75">\n              {active.status === "paused"\n                ? "메인 타이머에서 다시 시작하면 실제 시간 측정도 함께 재개됩니다."\n                : targetReached\n                  ? "목표 시간을 지났습니다. 드로다운이 끝나면 완료를 누르세요."\n                  : "드로다운이 끝나는 시점에 완료를 누르세요."}\n            </p>\n            <div className="mt-3 flex justify-end gap-2">\n              <button\n                type="button"\n                onClick={requestDiscard}\n                className="flex h-10 items-center gap-2 rounded-lg border border-white/35 px-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"\n              >\n                <Trash2 aria-hidden="true" size={16} />\n                추출 취소\n              </button>\n              <button\n                type="button"\n                onClick={finishBrew}\n                className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#173d34] transition hover:bg-[#e9f2ed] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#173d34]"\n              >\n                <Check aria-hidden="true" size={17} />\n                추출 완료\n              </button>\n            </div>\n          </div>`,
  ],
  [
    "discard dialog",
    `      {completed && (`,
    `      {discardOpen && active && (\n        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-6">\n          <section\n            role="alertdialog"\n            aria-modal="true"\n            aria-labelledby="discard-brew-title"\n            aria-describedby="discard-brew-description"\n            className="w-full rounded-t-2xl bg-[#f4f6f1] p-5 shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-6"\n          >\n            <div className="flex items-start gap-3">\n              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f9e4de] text-[#9a3f2e]">\n                <Trash2 aria-hidden="true" size={19} />\n              </span>\n              <div>\n                <h2 id="discard-brew-title" className="text-lg font-bold text-[#292d28]">\n                  진행 중인 추출을 폐기할까요?\n                </h2>\n                <p\n                  id="discard-brew-description"\n                  className="mt-2 text-sm leading-6 text-[#626b62]"\n                >\n                  타이머를 종료하고 아직 완료되지 않은 추출 기록을 삭제합니다.\n                  원두와 추천 설정은 유지되며, 삭제한 기록은 되돌릴 수 없습니다.\n                </p>\n              </div>\n            </div>\n\n            <div className="mt-5 rounded-xl border border-[#d7ded4] bg-white p-4">\n              <p className="truncate text-sm font-bold text-[#294f43]">\n                {active.recipeName}\n              </p>\n              <p className="mt-1 font-mono text-xl font-bold text-[#173d34]">\n                {formatTime(elapsedSeconds)}\n              </p>\n            </div>\n\n            {message && (\n              <p className="mt-4 rounded-lg bg-[#fff0eb] px-3 py-2 text-sm text-[#8b3e2f]">\n                {message}\n              </p>\n            )}\n\n            <div className="mt-5 grid grid-cols-2 gap-2">\n              <button\n                type="button"\n                onClick={closeDiscard}\n                disabled={discarding}\n                className="h-11 rounded-lg border border-[#c8d0c5] bg-white px-4 text-sm font-semibold text-[#526055] hover:bg-[#f8faf7] disabled:cursor-not-allowed disabled:opacity-60"\n              >\n                계속 추출\n              </button>\n              <button\n                type="button"\n                onClick={confirmDiscard}\n                disabled={discarding}\n                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#a54432] px-4 text-sm font-bold text-white hover:bg-[#8d3829] focus:outline-none focus:ring-2 focus:ring-[#a54432] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"\n              >\n                <Trash2 aria-hidden="true" size={17} />\n                {discarding ? "폐기 중" : "취소하고 폐기"}\n              </button>\n            </div>\n          </section>\n        </div>\n      )}\n\n      {completed && (`,
  ],
]);

await patch("app/BrewHistoryDrawer.tsx", [
  [
    "discard event import",
    'import BrewSessionManagerDialog from "./BrewSessionManagerDialog";\n',
    'import BrewSessionManagerDialog from "./BrewSessionManagerDialog";\nimport { brewSessionDiscardedEvent } from "@/lib/brew/activeBrewDiscard";\n',
  ],
  [
    "discard event subscription",
    `    window.addEventListener(brewFeedbackSavedEvent, refreshHistory);\n    return () => window.removeEventListener(brewFeedbackSavedEvent, refreshHistory);`,
    `    window.addEventListener(brewFeedbackSavedEvent, refreshHistory);\n    window.addEventListener(brewSessionDiscardedEvent, refreshHistory);\n    return () => {\n      window.removeEventListener(brewFeedbackSavedEvent, refreshHistory);\n      window.removeEventListener(brewSessionDiscardedEvent, refreshHistory);\n    };`,
  ],
]);

await patch("test/brew-session-clock.test.mjs", [
  [
    "clear import",
    `import {\n  completeBrewSessionClock,`,
    `import {\n  clearBrewSessionClock,\n  completeBrewSessionClock,`,
  ],
  [
    "clear assertion",
    `    assert.equal(clock.status, "completed");\n    assert.equal(clock.elapsedSeconds, 45);`,
    `    assert.equal(clock.status, "completed");\n    assert.equal(clock.elapsedSeconds, 45);\n\n    clearBrewSessionClock();\n    assert.equal(readBrewSessionClock(), null);`,
  ],
]);
