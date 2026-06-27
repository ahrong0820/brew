"use client";

import { useEffect, useState } from "react";
import AdjustmentOutcomeSelector from "@/app/AdjustmentOutcomeSelector";
import { syncSuccessfulRecipe } from "@/lib/brew/successRecipe";
import { brewFeedbackSavedEvent, saveBrewFeedback } from "@/lib/brew/sessionFeedback";
import { beanBrewProfileStore, brewSessionStore } from "@/lib/storage/coffeeData";
import type { BrewAdjustmentOutcome, BrewAdjustmentTrial } from "@/lib/types/coffee";

type Pending = { sessionId: string; trial: BrewAdjustmentTrial };

export default function AdjustmentOutcomeTracker() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [outcome, setOutcome] = useState<BrewAdjustmentOutcome | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const sessionId = (event as CustomEvent<{ sessionId: string }>).detail.sessionId;
      window.setTimeout(() => {
        const session = brewSessionStore.getById(sessionId);
        if (!session) return;
        if (session.tastingResult === "good") syncSuccessfulRecipe(session);
        if (!session.appliedAdjustmentId || session.adjustmentOutcome) return;
        const profile = beanBrewProfileStore.getById(session.profileId);
        const trial = (profile?.adjustmentHistory ?? []).find(
          (item) => item.id === session.appliedAdjustmentId,
        );
        if (trial) setPending({ sessionId, trial });
      }, 950);
    };
    window.addEventListener(brewFeedbackSavedEvent, handler);
    return () => window.removeEventListener(brewFeedbackSavedEvent, handler);
  }, []);

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 sm:items-center sm:p-6">
      <section className="w-full rounded-t-2xl bg-[#f4f6f1] p-5 sm:max-w-xl sm:rounded-2xl">
        <h2 className="text-xl font-bold">적용한 조정 비교</h2>
        <p className="mt-2 text-sm text-[#687168]">
          {pending.trial.currentValue} → {pending.trial.nextValue}
        </p>
        <AdjustmentOutcomeSelector value={outcome} onChange={setOutcome} />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setPending(null)} className="h-11 rounded-lg border bg-white">
            나중에
          </button>
          <button
            type="button"
            disabled={!outcome}
            onClick={() => {
              if (!outcome) return;
              saveBrewFeedback({ sessionId: pending.sessionId, adjustmentOutcome: outcome });
              setPending(null);
              setOutcome(null);
            }}
            className="h-11 rounded-lg bg-[#8a623d] font-bold text-white disabled:opacity-50"
          >
            결과 저장
          </button>
        </div>
      </section>
    </div>
  );
}
