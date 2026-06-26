"use client";

import {
  Coffee,
  History,
  MapPinned,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { recommendationTimerStartEvent } from "@/lib/timer/recommendationTimer";

const activeSessionStorageKey = "brew.activeRecommendationSession.v1";

const launcherTargets = [
  { key: "recommendation", label: "맞춤 추천" },
  { key: "beans", label: "내 원두" },
  { key: "origin-region", label: "세부 산지" },
  { key: "history", label: "추출 기록" },
  { key: "grind", label: "분쇄도 변환" },
  { key: "evidence", label: "근거 현황" },
] as const;

type LauncherKey = (typeof launcherTargets)[number]["key"];

function normalizedText(value: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function readActiveSession() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.sessionStorage.getItem(activeSessionStorageKey);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as { sessionId?: unknown };
    return typeof parsed.sessionId === "string" && parsed.sessionId.length > 0;
  } catch {
    return false;
  }
}

function findLauncher(key: LauncherKey) {
  return document.querySelector<HTMLButtonElement>(
    `button[data-mobile-coffee-target="${key}"]`,
  );
}

export default function MobileCoffeeNav() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeBrew, setActiveBrew] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");

    function syncLegacyLaunchers() {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));

      for (const button of buttons) {
        const text = normalizedText(button.textContent);
        const target = launcherTargets.find((item) => text.startsWith(item.label));

        if (!target) {
          continue;
        }

        button.dataset.mobileCoffeeTarget = target.key;
        if (media.matches) {
          button.style.setProperty("display", "none", "important");
        } else {
          button.style.removeProperty("display");
        }
      }
    }

    function syncActiveSession() {
      setActiveBrew(readActiveSession());
    }

    function handleTimerStart() {
      setActiveBrew(true);
      setToolsOpen(false);
    }

    const observer = new MutationObserver(syncLegacyLaunchers);
    observer.observe(document.body, { childList: true, subtree: true });
    media.addEventListener("change", syncLegacyLaunchers);
    window.addEventListener(recommendationTimerStartEvent, handleTimerStart);

    syncLegacyLaunchers();
    syncActiveSession();
    const intervalId = window.setInterval(syncActiveSession, 500);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncLegacyLaunchers);
      window.removeEventListener(recommendationTimerStartEvent, handleTimerStart);
      window.clearInterval(intervalId);

      for (const target of launcherTargets) {
        const button = findLauncher(target.key);
        button?.style.removeProperty("display");
        button?.removeAttribute("data-mobile-coffee-target");
      }
    };
  }, []);

  function openLauncher(key: LauncherKey) {
    const button = findLauncher(key);
    if (!button) {
      return;
    }

    setToolsOpen(false);
    button.click();
  }

  if (activeBrew) {
    return null;
  }

  return (
    <>
      <nav
        aria-label="커피 기능 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d6ddd3] bg-white/96 px-2 pt-1.5 shadow-[0_-8px_30px_rgba(35,47,38,0.12)] backdrop-blur sm:hidden"
        style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => openLauncher("recommendation")}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-[#2f6f5f] px-2 text-xs font-bold text-white shadow-sm"
          >
            <Sparkles aria-hidden="true" size={20} />
            추천
          </button>
          <button
            type="button"
            onClick={() => openLauncher("beans")}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#405047] transition active:bg-[#edf3ee]"
          >
            <Coffee aria-hidden="true" size={20} />
            원두
          </button>
          <button
            type="button"
            onClick={() => openLauncher("history")}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#405047] transition active:bg-[#edf3ee]"
          >
            <History aria-hidden="true" size={20} />
            기록
          </button>
          <button
            type="button"
            onClick={() => setToolsOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#405047] transition active:bg-[#edf3ee]"
          >
            <Wrench aria-hidden="true" size={20} />
            도구
          </button>
        </div>
      </nav>

      {toolsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:hidden">
          <button
            type="button"
            aria-label="도구 메뉴 닫기"
            onClick={() => setToolsOpen(false)}
            className="absolute inset-0"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-tools-title"
            className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-[#f4f6f1] px-4 pb-6 pt-4 shadow-2xl"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6a5a42]">
                  Coffee tools
                </p>
                <h2 id="mobile-tools-title" className="mt-1 text-lg font-bold">
                  도구
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                aria-label="도구 메뉴 닫기"
                className="rounded-full p-2 text-[#4d574d] active:bg-white"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => openLauncher("grind")}
              className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#d7ded4] bg-white p-4 text-left shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f0e7] text-[#6a5a42]">
                <Ruler aria-hidden="true" size={21} />
              </span>
              <span>
                <strong className="block text-sm">분쇄도 변환</strong>
                <span className="mt-1 block text-xs leading-5 text-[#687168]">
                  목표 대표 입도를 K-Ultra 또는 Encore 설정으로 변환합니다.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => openLauncher("origin-region")}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#d7ded4] bg-white p-4 text-left shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3ee] text-[#2f6f5f]">
                <MapPinned aria-hidden="true" size={21} />
              </span>
              <span>
                <strong className="block text-sm">세부 산지</strong>
                <span className="mt-1 block text-xs leading-5 text-[#687168]">
                  저장 원두에 지역·주·구역 정보를 추가하거나 수정합니다.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => openLauncher("evidence")}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#d7ded4] bg-white p-4 text-left shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f3f8] text-[#5b4f69]">
                <ShieldCheck aria-hidden="true" size={21} />
              </span>
              <span>
                <strong className="block text-sm">근거 현황</strong>
                <span className="mt-1 block text-xs leading-5 text-[#687168]">
                  현재 반영된 규칙과 후보·직접 검증 대기 자료를 구분해 확인합니다.
                </span>
              </span>
            </button>
          </section>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 639px) {
          body {
            padding-bottom: calc(4.8rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}
