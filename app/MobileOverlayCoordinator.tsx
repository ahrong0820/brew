"use client";

import { useEffect } from "react";

const modalSelector =
  '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]';

export default function MobileOverlayCoordinator() {
  useEffect(() => {
    const body = document.body;
    const previousOverflow = body.style.overflow;

    function syncOverlayState() {
      const modalCount = document.querySelectorAll(modalSelector).length;
      if (modalCount > 0) {
        body.dataset.coffeeOverlayOpen = "true";
        body.style.overflow = "hidden";
      } else {
        delete body.dataset.coffeeOverlayOpen;
        body.style.overflow = previousOverflow;
      }
    }

    const observer = new MutationObserver(syncOverlayState);
    observer.observe(body, { childList: true, subtree: true });
    syncOverlayState();

    return () => {
      observer.disconnect();
      delete body.dataset.coffeeOverlayOpen;
      body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <style>{`
      body[data-coffee-overlay-open="true"] > button.fixed.z-40,
      body[data-coffee-overlay-open="true"] > div.fixed.z-40 {
        visibility: hidden;
        pointer-events: none;
      }

      @media (max-width: 639px) {
        body:has(> div.fixed.inset-x-4.bottom-4.z-40) > button.fixed.z-40 {
          visibility: hidden;
          pointer-events: none;
        }
      }
    `}</style>
  );
}
