"use client";

import {
  ChevronDown,
  Coffee,
  Gauge,
  Play,
  Save,
  Settings2,
  Sparkles,
  Thermometer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { prepareRecommendationBrew } from "@/lib/recommendation/brewLaunch";
import { createRecommendation } from "@/lib/recommendation/engine";
import {
  beanStore,
  getUserPreferences,
  grinderProfileStore,
  initializeCoffeeStorage,
  saveUserPreferences,
} from "@/lib/storage/coffeeData";
import { dispatchRecommendationTimerStart } from "@/lib/timer/recommendationTimer";
import type {
  Bean,
  BrewerType,
  DrinkStyle,
  GrinderProfile,
  TasteGoal,
  UserPreferences,
} from "@/lib/types/coffee";
import type { BrewRecommendation } from "@/lib/types/recommendation";

const tasteOptions: Array<{
  value: TasteGoal;
  label: string;
  description: string;
}> = [
  { value: "sweet", label: "단맛", description: "둥글고 편안하게" },
  { value: "bright", label: "산미·향미", description: "선명하고 깨끗하게" },
  { value: "balanced", label: "밸런스", description: "안정적인 첫 추출" },
  { value: "body", label: "바디감", description: "진하고 묵직하게" },
];

const brewerOptions: Array<{ value: BrewerType; label: string }> = [
  { value: "v60", label: "V60" },
  { value: "clever", label: "클레버" },
  { value: "switch", label: "하리오 스위치" },
  { value: "other", label: "기타 드리퍼" },
];

const drinkStyleOptions: Array<{ value: DrinkStyle; label: string }> = [
  { value: "hot", label: "핫" },
  { value: "iced", label: "아이스" },
];

const fieldClass =
  "w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function confidenceLabel(recommendation: BrewRecommendation) {
  return recommendation.confidence === "medium" ? "보통" : "참고";
}

export default function RecommendationDrawer() {
  const [open, setOpen] = useState(false);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [grinders, setGrinders] = useState<GrinderProfile[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [beanId, setBeanId] = useState("");
  const [grinderId, setGrinderId] = useState("");
  const [tasteGoal, setTasteGoal] = useState<TasteGoal>("balanced");
  const [showSettings, setShowSettings] = useState(false);
  const [recommendation, setRecommendation] =
    useState<BrewRecommendation | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedBean = useMemo(
    () => beans.find((bean) => bean.id === beanId),
    [beans, beanId],
  );
  const selectedGrinder = useMemo(
    () => grinders.find((grinder) => grinder.id === grinderId),
    [grinders, grinderId],
  );

  function loadData() {
    initializeCoffeeStorage();
    const storedBeans = beanStore.list();
    const storedGrinders = grinderProfileStore.list();
    const storedPreferences = getUserPreferences();

    setBeans(storedBeans);
    setGrinders(storedGrinders);
    setPreferences(storedPreferences);
    setBeanId((current) =>
      storedBeans.some((bean) => bean.id === current)
        ? current
        : (storedBeans[0]?.id ?? ""),
    );
    setGrinderId((current) => {
      if (storedGrinders.some((grinder) => grinder.id === current)) {
        return current;
      }

      return storedGrinders.some(
        (grinder) => grinder.id === storedPreferences.defaultGrinderProfileId,
      )
        ? storedPreferences.defaultGrinderProfileId
        : (storedGrinders[0]?.id ?? "");
    });
    setTasteGoal(storedPreferences.defaultTasteGoal);
  }

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
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
    loadData();
    setRecommendation(null);
    setMessage(null);
    setOpen(true);
  }

  function updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) {
    setPreferences((current) =>
      current ? { ...current, [key]: value } : current,
    );
    setRecommendation(null);
    setMessage(null);
  }

  function saveEnvironment() {
    if (!preferences) {
      return false;
    }

    const nextPreferences: UserPreferences = {
      ...preferences,
      defaultGrinderProfileId: grinderId || preferences.defaultGrinderProfileId,
      defaultTasteGoal: tasteGoal,
      updatedAt: new Date().toISOString(),
    };
    const saved = saveUserPreferences(nextPreferences);

    if (saved) {
      setPreferences(nextPreferences);
      setMessage("기본 추출 환경을 저장했습니다.");
    } else {
      setMessage("기본 환경을 저장하지 못했습니다.");
    }

    return saved;
  }

  function generateRecommendation() {
    if (!selectedBean) {
      setMessage("먼저 내 원두에서 원두를 등록해 주세요.");
      return;
    }

    if (!selectedGrinder || !preferences) {
      setMessage("그라인더와 기본 추출 환경을 확인해 주세요.");
      return;
    }

    const nextPreferences: UserPreferences = {
      ...preferences,
      defaultGrinderProfileId: selectedGrinder.id,
      defaultTasteGoal: tasteGoal,
      updatedAt: new Date().toISOString(),
    };

    saveUserPreferences(nextPreferences);
    setPreferences(nextPreferences);
    setRecommendation(
      createRecommendation({
        bean: selectedBean,
        grinder: selectedGrinder,
        preferences: nextPreferences,
        tasteGoal,
      }),
    );
    setMessage(null);
  }

  function startRecommendedTimer() {
    if (!selectedBean || !selectedGrinder || !preferences || !recommendation) {
      setMessage("추천 조건을 다시 확인해 주세요.");
      return;
    }

    try {
      const detail = prepareRecommendationBrew({
        bean: selectedBean,
        grinder: selectedGrinder,
        brewerType: preferences.defaultBrewer,
        tasteGoal,
        recommendation,
      });

      dispatchRecommendationTimerStart(detail);
      setMessage(
        detail.isFirstSession
          ? "첫 추출 기록을 저장하고 타이머를 시작했습니다."
          : "새 추출 기록을 저장하고 타이머를 시작했습니다.",
      );
      setOpen(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "추출 기록을 저장하지 못했습니다.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="fixed bottom-20 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#8a623d] bg-[#fff8ee] px-4 text-sm font-semibold text-[#704b2d] shadow-lg transition hover:bg-[#f8ecdc] focus:outline-none focus:ring-2 focus:ring-[#8a623d] focus:ring-offset-2"
      >
        <Sparkles aria-hidden="true" size={18} />
        맞춤 추천
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="recommendation-title"
            className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-3xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a623d]">
                  Quick recommendation
                </p>
                <h2 id="recommendation-title" className="mt-1 text-xl font-bold">
                  원두 맞춤 추천
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f]"
                aria-label="맞춤 추천 닫기"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {beans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#aeb9ab] bg-white px-5 py-12 text-center">
                  <Coffee
                    aria-hidden="true"
                    className="mx-auto text-[#2f6f5f]"
                    size={32}
                  />
                  <h3 className="mt-4 font-bold">등록된 원두가 없습니다</h3>
                  <p className="mt-2 text-sm leading-6 text-[#687168]">
                    우측 하단의 내 원두에서 원두 이름, 배전도와 가공 방식을
                    먼저 등록해 주세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <section className="rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-semibold">
                          원두
                        </span>
                        <select
                          value={beanId}
                          onChange={(event) => {
                            setBeanId(event.target.value);
                            setRecommendation(null);
                          }}
                          className={fieldClass}
                        >
                          {beans.map((bean) => (
                            <option key={bean.id} value={bean.id}>
                              {bean.name}
                              {bean.roastDate ? ` · ${bean.roastDate}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="mb-1.5 block text-sm font-semibold">
                          그라인더
                        </span>
                        <select
                          value={grinderId}
                          onChange={(event) => {
                            setGrinderId(event.target.value);
                            setRecommendation(null);
                          }}
                          className={fieldClass}
                        >
                          {grinders.map((grinder) => (
                            <option key={grinder.id} value={grinder.id}>
                              {grinder.displayName} · {grinder.calibrationLabel}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div>
                        <span className="mb-1.5 block text-sm font-semibold">
                          현재 기본 조건
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSettings((current) => !current)}
                          className="flex w-full items-center justify-between rounded-lg border border-[#c8d0c5] bg-[#f8faf7] px-3 py-2.5 text-left text-sm"
                        >
                          <span>
                            {preferences
                              ? `${brewerOptions.find((item) => item.value === preferences.defaultBrewer)?.label} · ${preferences.defaultDoseGrams}g · ${preferences.defaultWaterGrams}g`
                              : "불러오는 중"}
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className={showSettings ? "rotate-180" : ""}
                            size={17}
                          />
                        </button>
                      </div>
                    </div>

                    <fieldset className="mt-5">
                      <legend className="text-sm font-semibold">원하는 맛</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {tasteOptions.map((option) => {
                          const selected = tasteGoal === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setTasteGoal(option.value);
                                setRecommendation(null);
                              }}
                              className={`rounded-lg border px-3 py-3 text-left transition ${
                                selected
                                  ? "border-[#2f6f5f] bg-[#eef5ef] text-[#245647]"
                                  : "border-[#d7ded4] bg-white hover:bg-[#f8faf7]"
                              }`}
                            >
                              <span className="block text-sm font-bold">
                                {option.label}
                              </span>
                              <span className="mt-1 block text-xs text-[#687168]">
                                {option.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {showSettings && preferences && (
                      <div className="mt-5 rounded-lg border border-[#d7ded4] bg-[#f8faf7] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Settings2 aria-hidden="true" size={17} />
                          <h3 className="text-sm font-bold">기본 추출 환경</h3>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label>
                            <span className="mb-1 block text-xs font-semibold">
                              드리퍼
                            </span>
                            <select
                              value={preferences.defaultBrewer}
                              onChange={(event) =>
                                updatePreference(
                                  "defaultBrewer",
                                  event.target.value as BrewerType,
                                )
                              }
                              className={fieldClass}
                            >
                              {brewerOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-semibold">
                              핫 / 아이스
                            </span>
                            <select
                              value={preferences.defaultDrinkStyle}
                              onChange={(event) =>
                                updatePreference(
                                  "defaultDrinkStyle",
                                  event.target.value as DrinkStyle,
                                )
                              }
                              className={fieldClass}
                            >
                              {drinkStyleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-semibold">
                              원두량(g)
                            </span>
                            <input
                              type="number"
                              min={8}
                              max={40}
                              step={1}
                              value={preferences.defaultDoseGrams}
                              onChange={(event) =>
                                updatePreference(
                                  "defaultDoseGrams",
                                  Number(event.target.value),
                                )
                              }
                              className={fieldClass}
                            />
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-semibold">
                              총 물량(g)
                            </span>
                            <input
                              type="number"
                              min={100}
                              max={700}
                              step={5}
                              value={preferences.defaultWaterGrams}
                              onChange={(event) =>
                                updatePreference(
                                  "defaultWaterGrams",
                                  Number(event.target.value),
                                )
                              }
                              className={fieldClass}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={saveEnvironment}
                          className="mt-3 flex items-center gap-1.5 rounded-lg border border-[#2f6f5f] bg-white px-3 py-2 text-xs font-semibold text-[#2f6f5f] hover:bg-[#eef5ef]"
                        >
                          <Save aria-hidden="true" size={14} />
                          기본 환경 저장
                        </button>
                      </div>
                    )}

                    {message && (
                      <p className="mt-4 rounded-lg bg-[#fff8ee] px-3 py-2 text-sm text-[#704b2d]">
                        {message}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={generateRecommendation}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f6f5f] px-4 py-3 text-sm font-bold text-white hover:bg-[#25594c] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
                    >
                      <Sparkles aria-hidden="true" size={18} />
                      추천 만들기
                    </button>
                  </section>

                  {recommendation && selectedBean && selectedGrinder && (
                    <section className="rounded-xl border border-[#c9d7c7] bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#2f6f5f]">
                            추천 결과
                          </p>
                          <h3 className="mt-1 text-lg font-bold">
                            {recommendation.templateName}
                          </h3>
                          <p className="mt-1 text-xs text-[#687168]">
                            {selectedBean.name} · {selectedGrinder.displayName}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#eef5ef] px-2.5 py-1 text-xs font-semibold text-[#2f6f5f]">
                          신뢰도 {confidenceLabel(recommendation)}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-[#f8faf7] p-3">
                          <p className="text-xs text-[#687168]">원두 / 물</p>
                          <p className="mt-1 font-bold">
                            {recommendation.doseGrams}g / {recommendation.waterGrams}g
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#f8faf7] p-3">
                          <p className="text-xs text-[#687168]">비율</p>
                          <p className="mt-1 font-bold">1:{recommendation.ratio}</p>
                        </div>
                        <div className="rounded-lg bg-[#f8faf7] p-3">
                          <p className="flex items-center gap-1 text-xs text-[#687168]">
                            <Thermometer aria-hidden="true" size={13} /> 온도
                          </p>
                          <p className="mt-1 font-bold">
                            {recommendation.temperatureCelsius}℃
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#f8faf7] p-3">
                          <p className="flex items-center gap-1 text-xs text-[#687168]">
                            <Gauge aria-hidden="true" size={13} /> 목표 시간
                          </p>
                          <p className="mt-1 font-bold">
                            {formatTime(recommendation.targetTimeMinSeconds)}~
                            {formatTime(recommendation.targetTimeMaxSeconds)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-[#ead9c7] bg-[#fff8ee] p-4">
                        <p className="text-xs font-semibold text-[#8a623d]">
                          추천 분쇄도
                        </p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-2xl font-bold text-[#51351f]">
                              {recommendation.grinder.displayValue}
                            </p>
                            <p className="mt-1 text-xs text-[#806448]">
                              범위 {recommendation.grinder.displayRange}
                            </p>
                          </div>
                          <p className="text-right text-xs font-medium text-[#806448]">
                            {recommendation.grinder.commonDescription}
                            <br />
                            {recommendation.grinder.calibrationLabel}
                          </p>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-[#806448]">
                          {recommendation.grinder.note}
                        </p>
                      </div>

                      <div className="mt-5">
                        <h4 className="text-sm font-bold">추출 순서</h4>
                        <ol className="mt-2 divide-y divide-[#edf1ea] rounded-lg border border-[#d7ded4]">
                          {recommendation.steps.map((step) => (
                            <li
                              key={`${step.label}-${step.startSeconds}`}
                              className="flex gap-3 px-3 py-3"
                            >
                              <span className="w-10 shrink-0 text-xs font-semibold text-[#2f6f5f]">
                                {formatTime(step.startSeconds)}
                              </span>
                              <div>
                                <p className="text-sm font-bold">
                                  {step.label} · {step.targetWaterGrams}g까지
                                </p>
                                <p className="mt-1 text-xs leading-5 text-[#687168]">
                                  {step.cue}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <button
                        type="button"
                        onClick={startRecommendedTimer}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8a623d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#735033] focus:outline-none focus:ring-2 focus:ring-[#8a623d] focus:ring-offset-2"
                      >
                        <Play aria-hidden="true" size={18} />
                        이 레시피로 타이머 시작
                      </button>
                      <p className="mt-2 text-center text-xs leading-5 text-[#687168]">
                        시작과 동시에 이 조건을 원두별 추출 기록에 저장합니다.
                      </p>

                      <div className="mt-5 rounded-lg bg-[#f8faf7] p-4">
                        <h4 className="text-sm font-bold">추천 근거</h4>
                        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#687168]">
                          {recommendation.reasons.map((reason) => (
                            <li key={reason}>• {reason}</li>
                          ))}
                        </ul>
                        <p className="mt-3 border-t border-[#e2e8df] pt-3 text-xs leading-5 text-[#687168]">
                          {recommendation.confidenceReason}
                        </p>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
