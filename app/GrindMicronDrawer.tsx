"use client";

import { Gauge, Info, Ruler, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  formatGrinderSetting,
  nearbyMicronReferencePoints,
  recommendSettingForMicrons,
} from "@/lib/grinder/micronReference";
import {
  grinderProfileStore,
  initializeCoffeeStorage,
} from "@/lib/storage/coffeeData";
import type { GrinderProfile } from "@/lib/types/coffee";

const supportedModels = new Set(["1zpresso-k-ultra", "baratza-encore"]);

const fieldClass =
  "w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#6a5a42] focus:ring-2 focus:ring-[#6a5a42]/20";

function unitLabel(profile: GrinderProfile) {
  if (profile.displayUnit === "dial") {
    return "다이얼";
  }

  if (profile.displayUnit === "click") {
    return "클릭";
  }

  return "Step";
}

export default function GrindMicronDrawer() {
  const [open, setOpen] = useState(false);
  const [grinders, setGrinders] = useState<GrinderProfile[]>([]);
  const [grinderId, setGrinderId] = useState("");
  const [targetMicrons, setTargetMicrons] = useState(1000);

  function loadProfiles() {
    initializeCoffeeStorage();
    const stored = grinderProfileStore
      .list()
      .filter(
        (profile) =>
          supportedModels.has(profile.model) &&
          (profile.micronReference?.points.length ?? 0) >= 2,
      );

    setGrinders(stored);
    setGrinderId((current) =>
      stored.some((profile) => profile.id === current)
        ? current
        : (stored[0]?.id ?? ""),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(loadProfiles, 0);
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

  const selectedGrinder = useMemo(
    () => grinders.find((profile) => profile.id === grinderId),
    [grinders, grinderId],
  );

  const recommendation = useMemo(
    () =>
      selectedGrinder
        ? recommendSettingForMicrons(selectedGrinder, targetMicrons)
        : null,
    [selectedGrinder, targetMicrons],
  );

  const nearbyPoints = useMemo(
    () =>
      selectedGrinder
        ? nearbyMicronReferencePoints(selectedGrinder, targetMicrons, 4)
        : [],
    [selectedGrinder, targetMicrons],
  );

  const referenceMin =
    selectedGrinder?.micronReference?.points.reduce(
      (minimum, point) => Math.min(minimum, point.microns),
      Number.POSITIVE_INFINITY,
    ) ?? 300;
  const referenceMax =
    selectedGrinder?.micronReference?.points.reduce(
      (maximum, point) => Math.max(maximum, point.microns),
      Number.NEGATIVE_INFINITY,
    ) ?? 1400;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          loadProfiles();
          setOpen(true);
        }}
        className="fixed bottom-36 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#6a5a42] bg-[#f5f0e7] px-4 text-sm font-semibold text-[#594a35] shadow-lg transition hover:bg-[#ebe3d6] focus:outline-none focus:ring-2 focus:ring-[#6a5a42] focus:ring-offset-2"
      >
        <Ruler aria-hidden="true" size={18} />
        분쇄도 변환
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="grind-micron-title"
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5a42]">
                  Grind reference
                </p>
                <h2 id="grind-micron-title" className="mt-1 text-xl font-bold">
                  대표 입도 → 그라인더 설정
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#6a5a42]"
                aria-label="분쇄도 변환 닫기"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <section className="rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-sm font-semibold">
                      그라인더
                    </span>
                    <select
                      value={grinderId}
                      onChange={(event) => setGrinderId(event.target.value)}
                      className={fieldClass}
                    >
                      {grinders.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.displayName} · {profile.calibrationLabel}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-semibold">
                      목표 대표 입도(μm)
                    </span>
                    <input
                      type="number"
                      min={250}
                      max={1500}
                      step={25}
                      value={targetMicrons}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value)) {
                          setTargetMicrons(value);
                        }
                      }}
                      className={fieldClass}
                    />
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className="sr-only">목표 대표 입도 조절</span>
                  <input
                    type="range"
                    min={Math.max(250, Math.floor(referenceMin / 25) * 25)}
                    max={Math.min(1500, Math.ceil(referenceMax / 25) * 25)}
                    step={25}
                    value={Math.min(referenceMax, Math.max(referenceMin, targetMicrons))}
                    onChange={(event) => setTargetMicrons(Number(event.target.value))}
                    className="w-full accent-[#6a5a42]"
                  />
                </label>

                <div className="mt-2 flex justify-between text-xs text-[#687168]">
                  <span>{Math.round(referenceMin)}μm</span>
                  <span>{Math.round(referenceMax)}μm</span>
                </div>
              </section>

              {selectedGrinder && recommendation && (
                <section className="mt-5 rounded-xl border border-[#d8cbb9] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#6a5a42]">
                        변환 결과
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        {selectedGrinder.displayName}
                      </h3>
                      <p className="mt-1 text-xs text-[#687168]">
                        {selectedGrinder.calibrationLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f5f0e7] px-2.5 py-1 text-xs font-semibold text-[#6a5a42]">
                      참고값
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-[#f8faf7] p-4">
                      <p className="text-xs text-[#687168]">목표 대표 입도</p>
                      <p className="mt-1 text-xl font-bold">
                        {Math.round(targetMicrons).toLocaleString("ko-KR")}μm
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#f5f0e7] p-4">
                      <p className="flex items-center gap-1 text-xs text-[#6a5a42]">
                        <Gauge aria-hidden="true" size={13} /> 추천 시작점
                      </p>
                      <p className="mt-1 text-xl font-bold text-[#4f402d]">
                        {formatGrinderSetting(
                          selectedGrinder,
                          recommendation.setting,
                        )} {unitLabel(selectedGrinder)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-[#eadfce] bg-[#fffaf2] px-4 py-3">
                    <p className="text-xs text-[#806448]">권장 탐색 범위</p>
                    <p className="mt-1 font-bold text-[#513f2c]">
                      {formatGrinderSetting(
                        selectedGrinder,
                        recommendation.settingMin,
                      )}
                      ~
                      {formatGrinderSetting(
                        selectedGrinder,
                        recommendation.settingMax,
                      )} {unitLabel(selectedGrinder)}
                    </p>
                  </div>

                  {recommendation.isClamped && (
                    <p className="mt-3 rounded-lg bg-[#fff1e6] px-3 py-2 text-xs leading-5 text-[#8a4d24]">
                      선택한 값이 현재 참조 범위를 벗어나 가장 가까운 설정으로
                      제한되었습니다.
                    </p>
                  )}

                  <div className="mt-5">
                    <h4 className="text-sm font-bold">가까운 참조 지점</h4>
                    <div className="mt-2 overflow-hidden rounded-lg border border-[#d7ded4]">
                      <table className="w-full text-sm">
                        <thead className="bg-[#f8faf7] text-xs text-[#687168]">
                          <tr>
                            <th className="px-3 py-2 text-left">설정</th>
                            <th className="px-3 py-2 text-right">예상 대표 입도</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#edf1ea]">
                          {nearbyPoints.map((point) => (
                            <tr key={`${point.step}-${point.microns}`}>
                              <td className="px-3 py-2 font-semibold">
                                {formatGrinderSetting(selectedGrinder, point.step)} {unitLabel(selectedGrinder)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {point.microns.toLocaleString("ko-KR")}μm
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 rounded-lg bg-[#f8faf7] p-4 text-xs leading-5 text-[#687168]">
                    <Info aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                    <p>
                      대표 입도는 분쇄물 전체를 하나의 숫자로 단순화한 참고값입니다.
                      모든 입자가 같은 크기라는 뜻이 아니며, 원두와 기기 편차에 따라
                      실제 유속과 맛을 확인해 K-Ultra는 0.1~0.2, Encore는 1~2클릭씩
                      조정하세요.
                    </p>
                  </div>
                </section>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
