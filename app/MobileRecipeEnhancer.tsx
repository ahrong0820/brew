"use client";

import { useEffect } from "react";

const mobileQuery = "(max-width: 1023px)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const timerDoseSelector = 'input[data-timer-dose-input="true"]';
const timerDoseMin = 8;
const timerDoseMax = 40;

function getDirectChild<T extends Element>(
  parent: Element | null,
  predicate: (element: Element) => boolean,
): T | null {
  if (!parent) {
    return null;
  }

  return (Array.from(parent.children).find(predicate) as T | undefined) ?? null;
}

function isValidTimerDose(value: number) {
  return Number.isFinite(value) && value >= timerDoseMin && value <= timerDoseMax;
}

function normalizeTimerDose(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(timerDoseMax, Math.max(timerDoseMin, Math.round(value)));
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  );

  if (descriptor?.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }
}

function findTimerDoseInput(timerPanel: HTMLElement | null) {
  if (!timerPanel) {
    return null;
  }

  return (
    Array.from(
      timerPanel.querySelectorAll<HTMLInputElement>('input[type="number"]'),
    ).find(
      (input) =>
        input.min === String(timerDoseMin) &&
        input.max === String(timerDoseMax) &&
        input.closest("label")?.textContent?.includes("원두량"),
    ) ?? null
  );
}

// Adds mobile-only presentation behavior without changing recipe or timer state.
export default function MobileRecipeEnhancer() {
  useEffect(() => {
    let customSection: HTMLElement | null = null;
    let editingDoseInput: HTMLInputElement | null = null;
    let editingDoseDraft = "";
    const lastValidDose = new WeakMap<HTMLInputElement, number>();

    function updateToggle(button: HTMLButtonElement, open: boolean) {
      const expanded = String(open);
      const label = open ? "편집기 닫기" : "＋ 나만의 레시피 만들기";

      if (button.getAttribute("aria-expanded") !== expanded) {
        button.setAttribute("aria-expanded", expanded);
      }

      if (button.textContent !== label) {
        button.textContent = label;
      }
    }

    function setEditorOpen(open: boolean) {
      if (!customSection) {
        return;
      }

      customSection.dataset.customEditorOpen = String(open);
      const button = customSection.querySelector(
        ":scope > [data-custom-editor-toggle]",
      ) as HTMLButtonElement | null;

      if (button) {
        updateToggle(button, open);
      }
    }

    function syncTimerDoseInput(timerPanel: HTMLElement | null) {
      const input = findTimerDoseInput(timerPanel);
      if (!input) {
        return;
      }

      input.dataset.timerDoseInput = "true";
      const value = input.valueAsNumber;
      if (isValidTimerDose(value) && document.activeElement !== input) {
        lastValidDose.set(input, value);
      }
    }

    function syncDom() {
      const mainGrid = document.querySelector("main > header + div");
      const contentSection = getDirectChild<HTMLElement>(
        mainGrid,
        (element) => element.tagName === "SECTION",
      );
      const timerPanel = getDirectChild<HTMLElement>(
        mainGrid,
        (element) => element.tagName === "ASIDE",
      );

      contentSection?.setAttribute("data-main-content", "true");
      timerPanel?.setAttribute("data-timer-panel", "true");
      syncTimerDoseInput(timerPanel);

      if (!contentSection) {
        return;
      }

      const directDivs = Array.from(contentSection.children).filter(
        (element) => element.tagName === "DIV",
      ) as HTMLElement[];
      const recipeList = directDivs[1];

      if (recipeList) {
        recipeList.dataset.recipeList = "true";
        Array.from(recipeList.children).forEach((element) => {
          if (element.tagName !== "BUTTON") {
            return;
          }

          const recipeRow = element as HTMLElement;
          recipeRow.dataset.recipeRow = "true";

          if (recipeRow.classList.contains("ring-2")) {
            recipeRow.setAttribute("aria-current", "true");
          } else {
            recipeRow.removeAttribute("aria-current");
          }
        });
      }

      customSection =
        (Array.from(contentSection.children).find(
          (element) =>
            element.tagName === "SECTION" &&
            element.querySelector("h2")?.textContent?.trim() ===
              "나만의 레시피",
        ) as HTMLElement | undefined) ?? null;

      if (!customSection) {
        return;
      }

      if (!customSection.dataset.customEditorOpen) {
        customSection.dataset.customEditorOpen = "false";
      }

      let toggle = customSection.querySelector(
        ":scope > [data-custom-editor-toggle]",
      ) as HTMLButtonElement | null;

      if (!toggle) {
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.dataset.customEditorToggle = "true";
        toggle.className = "mobile-custom-toggle";
        customSection.firstElementChild?.insertAdjacentElement(
          "afterend",
          toggle,
        );
      }

      updateToggle(
        toggle,
        customSection.dataset.customEditorOpen === "true",
      );
    }

    function handleTimerDoseFocus(event: FocusEvent) {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const input = event.target;
      if (!input.matches(timerDoseSelector)) {
        return;
      }

      editingDoseInput = input;
      editingDoseDraft = input.value;
      if (isValidTimerDose(input.valueAsNumber)) {
        lastValidDose.set(input, input.valueAsNumber);
      }
    }

    function handleTimerDoseInput(event: Event) {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const input = event.target;
      if (!input.matches(timerDoseSelector)) {
        return;
      }

      editingDoseInput = input;
      editingDoseDraft = input.value;
      const value = input.valueAsNumber;

      if (input.value === "" || !isValidTimerDose(value)) {
        event.stopPropagation();
        return;
      }

      lastValidDose.set(input, value);
    }

    function handleTimerDoseBlur(event: FocusEvent) {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const input = event.target;
      if (!input.matches(timerDoseSelector)) {
        return;
      }

      const fallback = lastValidDose.get(input) ?? timerDoseMin;
      const normalized = normalizeTimerDose(input.valueAsNumber, fallback);
      editingDoseInput = null;
      editingDoseDraft = String(normalized);
      lastValidDose.set(input, normalized);

      if (input.value !== String(normalized)) {
        setNativeInputValue(input, String(normalized));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    function maintainTimerDoseDraft() {
      if (
        editingDoseInput &&
        document.activeElement === editingDoseInput &&
        editingDoseInput.value !== editingDoseDraft
      ) {
        setNativeInputValue(editingDoseInput, editingDoseDraft);
      }
    }

    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const toggle = event.target.closest(
        "[data-custom-editor-toggle]",
      ) as HTMLButtonElement | null;

      if (toggle) {
        setEditorOpen(toggle.getAttribute("aria-expanded") !== "true");
        return;
      }

      const recipeRow = event.target.closest('[data-recipe-row="true"]');

      if (recipeRow && window.matchMedia(mobileQuery).matches) {
        const timerPanel = document.querySelector(
          '[data-timer-panel="true"]',
        ) as HTMLElement | null;
        const reducedMotion = window.matchMedia(reducedMotionQuery).matches;

        window.requestAnimationFrame(() => {
          timerPanel?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start",
          });
        });
      }

      const clickedButton = event.target.closest("button");

      if (
        clickedButton &&
        customSection?.contains(clickedButton) &&
        clickedButton.textContent?.includes("레시피 저장")
      ) {
        window.setTimeout(() => {
          syncDom();
          setEditorOpen(false);
        }, 0);
      }
    }

    syncDom();
    document.addEventListener("click", handleClick);
    document.addEventListener("focusin", handleTimerDoseFocus);
    document.addEventListener("input", handleTimerDoseInput, true);
    document.addEventListener("focusout", handleTimerDoseBlur);

    const doseDraftInterval = window.setInterval(maintainTimerDoseDraft, 100);
    const observer = new MutationObserver(syncDom);
    const observerTarget = document.querySelector("main");

    if (observerTarget) {
      observer.observe(observerTarget, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
      window.clearInterval(doseDraftInterval);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("focusin", handleTimerDoseFocus);
      document.removeEventListener("input", handleTimerDoseInput, true);
      document.removeEventListener("focusout", handleTimerDoseBlur);
      document
        .querySelectorAll("[data-custom-editor-toggle]")
        .forEach((element) => element.remove());
      document
        .querySelectorAll(timerDoseSelector)
        .forEach((element) => element.removeAttribute("data-timer-dose-input"));
    };
  }, []);

  return null;
}
