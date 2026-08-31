"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";

export type CoffeeTool =
  | "recommendation"
  | "beans"
  | "origin-region"
  | "history"
  | "grind"
  | "recipe-order"
  | "evidence"
  | "personal-recipes";

type CoffeeToolContextValue = {
  activeTool: CoffeeTool | null;
  openTool: (tool: CoffeeTool) => void;
  closeTool: () => void;
};

const CoffeeToolContext = createContext<CoffeeToolContextValue | null>(null);

export function CoffeeToolProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<CoffeeTool | null>(null);
  const openTool = useCallback((tool: CoffeeTool) => setActiveTool(tool), []);
  const closeTool = useCallback(() => setActiveTool(null), []);
  const value = useMemo(
    () => ({ activeTool, openTool, closeTool }),
    [activeTool, closeTool, openTool],
  );

  useEffect(() => {
    if (!activeTool) {
      return;
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [activeTool]);

  return (
    <CoffeeToolContext.Provider value={value}>
      {children}
      {activeTool ? (
        <style>{`
          [data-coffee-tool-launcher="true"] {
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `}</style>
      ) : null}
    </CoffeeToolContext.Provider>
  );
}

export function useCoffeeTools() {
  const context = useContext(CoffeeToolContext);
  if (!context) {
    throw new Error("useCoffeeTools must be used inside CoffeeToolProvider");
  }
  return context;
}

export function useCoffeeToolOpen(tool: CoffeeTool) {
  const { activeTool, openTool, closeTool } = useCoffeeTools();
  const open = activeTool === tool;

  const setOpen = useCallback(
    (next: SetStateAction<boolean>) => {
      const nextOpen = typeof next === "function" ? next(open) : next;
      if (nextOpen) {
        openTool(tool);
      } else if (open) {
        closeTool();
      }
    },
    [closeTool, open, openTool, tool],
  );

  return [open, setOpen] as const;
}
