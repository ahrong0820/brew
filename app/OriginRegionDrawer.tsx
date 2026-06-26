"use client";

import { MapPinned, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  formatOriginRegionInput,
  parseOriginRegionInput,
} from "@/lib/domain/originRegions";
import { withUpdatedTimestamp } from "@/lib/domain/factories";
import {
  beanStore,
  initializeCoffeeStorage,
} from "@/lib/storage/coffeeData";
import type { Bean } from "@/lib/types/coffee";

const inputClass =
  "w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20";

export default function OriginRegionDrawer() {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function reloadBeans() {
    const storedBeans = beanStore
      .list()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setBeans(storedBeans);
    setDrafts(
      Object.fromEntries(
        storedBeans.map((bean) => [
          bean.id,
          formatOriginRegionInput(bean.originRegions),
        ]),
      ),
    );
  }

  useEffect(() => {
    initializeCoffeeStorage();
    const timer = window.setTimeout(reloadBeans, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function openDrawer() {
    reloadBeans();
    setMessage(null);
    setOpen(true);
  }

  function updateDraft(beanId: string, value: string) {
    setDrafts((current) => ({ ...current, [beanId]: value }));
    setMessage(null);
  }

  function saveRegions(bean: Bean) {
    const originRegions = parseOriginRegionInput(drafts[bean.id] ?? "");
    const saved = beanStore.upsert(
      withUpdatedTimestamp({
        ...bean,
        originRegions,
      }),
    );

    if (!saved) {
      setMessage("세부 산지 정보를 저장하지 못했습니다.");
      return;
    }

    reloadBeans();
    setMessage(`“${bean.name}”의 세부 산지를 저장했습니다.`);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="fixed bottom-[17rem] right-4 z-40 flex h-11 items-center gap-2 rounded-full border border-[#7b897c] bg-white px-4 text-sm font-semibold text-[#334138] shadow-lg transition hover:bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
        aria-label="세부 산지 관리 열기"
      >
        <MapPinned aria-hidden="true" size={18} />
        세부 산지
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/35" role="presentation">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="세부 산지 관리 닫기"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="origin-region-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-[#f7f8f5] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#d7ded4] bg-white px-5 py-5">
              <div>
                <p className="text-xs font-semibold text-[#2f6f5f]">원두 데이터</p>
                <h2 id="origin-region-title" className="mt-1 text-xl font-bold">
                  세부 산지 관리
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#687168]">
                  지역명은 쉼표 또는 줄바꿈으로 구분합니다. 철자와 별칭은 자동으로
                  합치지 않습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[#687168] hover:bg-[#edf1ea]"
                aria-label="세부 산지 관리 닫기"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              {message && (
                <p
                  role="status"
                  className="mb-4 rounded-lg border border-[#a9c8b9] bg-[#edf7f1] px-3 py-2 text-sm font-medium text-[#245647]"
                >
                  {message}
                </p>
              )}

              {beans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#aeb9ab] bg-white px-5 py-10 text-center">
                  <MapPinned
                    aria-hidden="true"
                    className="mx-auto text-[#2f6f5f]"
                    size={28}
                  />
                  <h3 className="mt-3 font-bold">저장된 원두가 없습니다</h3>
                  <p className="mt-2 text-sm leading-6 text-[#687168]">
                    먼저 원두 관리에서 원두를 등록한 뒤 세부 지역을 입력해 주세요.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {beans.map((bean) => (
                    <li
                      key={bean.id}
                      className="rounded-xl border border-[#d7ded4] bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3">
                        <h3 className="font-bold">{bean.name}</h3>
                        {bean.roaster && (
                          <p className="mt-0.5 text-xs text-[#687168]">
                            {bean.roaster}
                          </p>
                        )}
                      </div>

                      <label>
                        <span className="mb-1.5 block text-sm font-semibold">
                          지역·주·구역
                        </span>
                        <textarea
                          value={drafts[bean.id] ?? ""}
                          onChange={(event) =>
                            updateDraft(bean.id, event.target.value)
                          }
                          rows={2}
                          placeholder="예: Guji, Hambela Wamena"
                          className={`${inputClass} resize-y`}
                        />
                        <span className="mt-1.5 block text-xs leading-5 text-[#687168]">
                          입력 예: Guji, Sidama, Huila, Minas Gerais
                        </span>
                      </label>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveRegions(bean)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#2f6f5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#25594c]"
                        >
                          <Save aria-hidden="true" size={14} />
                          지역 저장
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
