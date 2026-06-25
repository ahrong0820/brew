"use client";

import { useEffect } from "react";

const mobileQuery = "(max-width: 1023px)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function getDirectChild<T extends Element>(
  parent: Element | null,
  predicate: (element: Element) => boolean,
): T | null {
  if (!parent) {
    return null;
  }

  return (Array.from(parent.children).find(predicate) as T | undefined) ?? null;
}

// Adds mobile-only presentation behavior without changing recipe or timer state.
export default function MobileRecipeEnhancer() {
  useEffect(() => {
    let customSection: HTMLElement | null = null;

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
      document.removeEventListener("click", handleClick);
      document
        .querySelectorAll("[data-custom-editor-toggle]")
        .forEach((element) => element.remove());
    };
  }, []);

  return null;
}
