"use client";

import { Award, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  clearCurrentBestSession,
  deleteBrewSessionRecord,
  setCurrentBestSession,
  updateBrewSessionRecord,
} from "@/lib/brew/sessionManagement";
import { getLinkedCustomRecipeCount } from "@/lib/customRecipes/sourceLinks";
import type { BrewSession, TastingResult } from "@/lib/types/coffee";

interface BrewSessionManagerDialogProps {
  session: BrewSession;
  isCurrentBest: boolean;
  onClose: () => void;
  onChanged: (message: string) => void;
}

const tastingOptions: Array<{
  value: TastingResult;
  label: string;
}> = [
  { value: "good", label: "좋음" },
  { value: "too-sour", label: "시고 덜 추출됨" },
  { value: "not-sweet-enough", label: "단맛 부족" },
  { value: "bitter-astringent", label: "쓰고 떫음" },
  { value: "too-weak", label: "너무 연함" },
  { value: "too-strong", label: "너무 진함" },
  { value: "aroma-muted", label: "향이 답답함" },
];

function initialMinutes(seconds: number | undefined) {
  return seconds === undefined ? 0 : Math.floor(seconds / 60);
}

function initialSeconds(seconds: number | undefined) {
  return seconds === undefined ? 0 : seconds % 60;
}

export default function BrewSessionManagerDialog({
  session,
  isCurrentBest,
  onClose,
  onChanged,
}: BrewSessionManagerDialogProps) {
  const [minutes, setMinutes] = useState(initialMinutes(session.actualTimeSeconds));
  const [seconds, setSeconds] = useState(initialSeconds(session.actualTimeSeconds));
  const [tastingResult, setTastingResult] = useState<TastingResult | "">(
    session.tastingResult ?? "",
  );
  const [note, setNote] = useState(session.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const linkedRecipeCount = getLinkedCustomRecipeCount(session.id);

  function formActualTime() {
    const safeMinutes = Math.max(0, Math.round(minutes));
    const safeSeconds = Math.min(59, Math.max(0, Math.round(seconds)));
    const total = safeMinutes * 60 + safeSeconds;
    return total > 0 ? total : null;
  }

  function saveForm() {
    return updateBrewSessionRecord({
      sessionId: session.id,
      actualTimeSeconds: formActualTime(),
      tastingResult: tastingResult || null,
      note,
    });
  }

  function handleSave() {
    setBusy(true);
    setMessage(null);

    try {
      saveForm();
      onChanged("추출 기록을 수정했습니다.");
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "추출 기록을 수정하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleBest() {
    if (!isCurrentBest && tastingResult !== "good") {
      setMessage("맛 평가를 ‘좋음’으로 선택해야 현재 베스트로 지정할 수 있습니다.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      if (isCurrentBest) {
        clearCurrentBestSession(session.profileId);
        onChanged("현재 베스트 지정을 해제했습니다.");
      } else {
        saveForm();
        setCurrentBestSession(session.id);
        onChanged("이 추출을 현재 베스트로 지정했습니다.");
      }
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "현재 베스트 상태를 변경하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    const linkedWarning =
      linkedRecipeCount > 0
        ? `\n\n이 기록에서 만든 나만의 레시피 ${linkedRecipeCount}개는 독립 레시피로 남습니다.`
        : "";
    const confirmed = window.confirm(
      `이 추출 기록을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.${linkedWarning}`,
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const result = deleteBrewSessionRecord(session.id);
      onChanged(
        result.linkedRecipesDetached
          ? "추출 기록을 삭제했습니다."
          : "추출 기록은 삭제했지만 나만의 레시피 원본 연결 일부를 정리하지 못했습니다.",
      );
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "추출 기록을 삭제하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-manager-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[#f4f6f1] p-4 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#586a80]">
              Brew session
            </p>
            <h2 id="session-manager-title" className="mt-1 text-xl font-bold">
              추출 기록 관리
            </h2>
            <p className="mt-1 text-sm text-[#687168]">
              {session.recipeSnapshot.sourceTemplateName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="추출 기록 관리 닫기"
            className="rounded-full p-2 text-[#4d574d] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#586a80]"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-[#d7ded4] bg-white p-4">
          <p className="text-sm font-bold">실제 추출 시간</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label>
              <span className="text-xs text-[#687168]">분</span>
              <input
                type="number"
                min={0}
                max={30}
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
                className="mt-1 h-11 w-full rounded-lg border border-[#c8d0c5] px-3 text-sm outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
              />
            </label>
            <label>
              <span className="text-xs text-[#687168]">초</span>
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(event) => setSeconds(Number(event.target.value))}
                className="mt-1 h-11 w-full rounded-lg border border-[#c8d0c5] px-3 text-sm outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
              />
            </label>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-bold">맛 평가</span>
          <select
            value={tastingResult}
            onChange={(event) =>
              setTastingResult(event.target.value as TastingResult | "")
            }
            className="mt-2 h-11 w-full rounded-lg border border-[#c8d0c5] bg-white px-3 text-sm outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
          >
            <option value="">미평가</option>
            {tastingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-bold">메모</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="향미, 유속, 온도 변화 등 다음 추출에 참고할 내용을 적어 주세요."
            className="mt-2 w-full rounded-xl border border-[#c8d0c5] bg-white px-3 py-3 text-sm outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
          />
        </label>

        {linkedRecipeCount > 0 && (
          <p className="mt-4 rounded-lg bg-[#fff8e7] px-3 py-2 text-xs leading-5 text-[#725b2c]">
            이 기록에서 나만의 레시피 {linkedRecipeCount}개를 만들었습니다. 기록을
            삭제해도 복사된 레시피는 독립적으로 유지됩니다.
          </p>
        )}

        {message && (
          <p role="status" className="mt-4 rounded-lg bg-[#fff0e8] px-3 py-2 text-sm text-[#8a4d24]">
            {message}
          </p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2f6f5f] px-4 text-sm font-bold text-white hover:bg-[#25594c] disabled:opacity-50"
          >
            <Save aria-hidden="true" size={17} />
            수정 저장
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleBest}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold disabled:opacity-50 ${
              isCurrentBest
                ? "border-[#a78c4f] bg-[#fff9e9] text-[#715927]"
                : "border-[#586a80] bg-white text-[#40536a]"
            }`}
          >
            <Award aria-hidden="true" size={17} />
            {isCurrentBest ? "현재 베스트 해제" : "현재 베스트로 지정"}
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#c16b5a] bg-white px-4 text-sm font-bold text-[#a14738] hover:bg-[#fff1ee] disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" size={17} />
          추출 기록 삭제
        </button>
      </section>
    </div>
  );
}
