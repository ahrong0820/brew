"use client";

import {
  Coffee,
  Droplets,
  Gauge,
  Play,
  Save,
  Sparkles,
  Thermometer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { prepareRecommendationBrew } from "@/lib/recommendation/brewLaunch";
import { createRecommendation } from "@/lib/recommendation/engine";
import {
  applyRatioAndWater,
  recommendedRatioForTaste,
  recommendedWaterGrams,
} from "@/lib/recommendation/recipeMath";
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

const fieldClass =
  "w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function normalizedDose(value: number) {
  return Number.isFinite(value)
    ? Math.min(40, Math.max(8, Math.round(value)))
    : 15;
}

export default function RecommendationDrawerV2() {
  const [open, setOpen] = useState(false);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [grinders, setGrinders] = useState<GrinderProfile[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [beanId, setBeanId] = useState("");
  const [grinderId, setGrinderId] = useState("");
  const [tasteGoal, setTasteGoal] = useState<TasteGoal>("balanced");
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
  const dose = normalizedDose(preferences?.defaultDoseGrams ?? 15);
  const baseRatio = recommendedRatioForTaste(tasteGoal);
  const calculatedWater = recommendedWaterGrams(dose, baseRatio);

  function loadData() {
    initializeCoffeeStorage();
    const storedBeans = beanStore.list();
    const storedGrinders = grinderProfileStore.list();
    const storedPreferences = getUserPreferences();

    setBeans(storedBeans);
    setGrinders(storedGrinders);
    setPreferences(storedPreferences);
    setTasteGoal(storedPreferences.defaultTasteGoal);
    setBeanId((current) =>
      storedBeans.some((bean) => bean.id === current)
        ? current
        : (storedBeans[0]?.id ?? ""),
    );
    setGrinderId((current) =>
      storedGrinders.some((grinder) => grinder.id === current)
        ? current
        : storedGrinders.some(
              (grinder) =>
                grinder.id === storedPreferences.defaultGrinderProfileId,
            )
          ? storedPreferences.defaultGrinderProfileId
          : (storedGrinders[0]?.id ?? ""),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

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

  function buildPreferences() {
    if (!preferences) return null;
    const safeDose = normalizedDose(preferences.defaultDoseGrams);
    return {
      ...preferences,
      defaultDoseGrams: safeDose,
      defaultWaterGrams: recommendedWaterGrams(
        safeDose,
        recommendedRatioForTaste(tasteGoal),
      ),
      defaultGrinderProfileId:
        grinderId || preferences.defaultGrinderProfileId,
      defaultTasteGoal: tasteGoal,
      updatedAt: new Date().toISOString(),
    } satisfies UserPreferences;
  }

  function saveEnvironment() {
    const next = buildPreferences();
    if (!next) return;
    if (saveUserPreferences(next)) {
      setPreferences(next);
      setMessage("현재 조건을 기본값으로 저장했습니다.");
    } else {
      setMessage("기본 환경을 저장하지 못했습니다.");
    }
  }

  function generateRecommendation() {
    const next = buildPreferences();
    if (!selectedBean) {
      setMessage("먼저 내 원두에서 원두를 등록해 주세요.");
      return;
    }
    if (!selectedGrinder || !next) {
      setMessage("그라인더와 추출 조건을 확인해 주세요.");
      return;
    }

    saveUserPreferences(next);
    setPreferences(next);
    const generated = createRecommendation({
      bean: selectedBean,
      grinder: selectedGrinder,
      preferences: next,
      tasteGoal,
    });
    setRecommendation(applyRatioAndWater(generated, generated.ratio));
    setMessage(null);
  }

  function startTimer() {
    if (!selectedBean || !selectedGrinder || !preferences || !recommendation) {
      setMessage("추천 조건을 다시 확인해 주세요.");
      return;
    }

    try {
      const detail = prepareRecommendationBrew({
        bean: selectedBean,
        grinder: selectedGrinder,
        brewerType: preferences.defaultBrewer,
        drinkStyle: preferences.defaultDrinkStyle,
        tasteGoal,
        recommendation,
      });
      dispatchRecommendationTimerStart(detail);
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
        onClick={() => {
          loadData();
          setRecommendation(null);
          setMessage(null);
          setOpen(true);
        }}
        className="fixed bottom-20 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#8a623d] bg-[#fff8ee] px-4 text-sm font-semibold text-[#704b2d] shadow-lg transition hover:bg-[#f8ecdc] focus:outline-none focus:ring-2 focus:ring-[#8a623d] focus:ring-offset-2"
      >
        <Sparkles aria-hidden="true" size={18} /> 맞춤 추천
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="recommendation-v2-title"
            className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-3xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a623d]">
                  Quick recommendation
                </p>
                <h2 id="recommendation-v2-title" className="mt-1 text-xl font-bold">
                  원두 맞춤 추천
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="맞춤 추천 닫기"
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea]"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {beans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#aeb9ab] bg-white px-5 py-12 text-center">
                  <Coffee className="mx-auto text-[#2f6f5f]" size={32} />
                  <h3 className="mt-4 font-bold">등록된 원두가 없습니다</h3>
                  <p className="mt-2 text-sm text-[#687168]">
                    내 원두에서 원두 정보를 먼저 등록해 주세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <section className="rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-semibold">원두</span>
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
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="mb-1.5 block text-sm font-semibold">원두량(g)</span>
                        <input
                          type="number"
                          min={8}
                          max={40}
                          step={1}
                          value={preferences?.defaultDoseGrams ?? 15}
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
                        <span className="mb-1.5 block text-sm font-semibold">드리퍼</span>
                        <select
                          value={preferences?.defaultBrewer ?? "v60"}
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
                        <span className="mb-1.5 block text-sm font-semibold">그라인더</span>
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

                      <label>
                        <span className="mb-1.5 block text-sm font-semibold">음용 방식</span>
                        <select
                          value={preferences?.defaultDrinkStyle ?? "hot"}
                          onChange={(event) =>
                            updatePreference(
                              "defaultDrinkStyle",
                              event.target.value as DrinkStyle,
                            )
                          }
                          className={fieldClass}
                        >
                          <option value="hot">핫</option>
                          <option value="iced">아이스</option>
                        </select>
                      </label>
                    </div>

                    <fieldset className="mt-5">
                      <legend className="text-sm font-semibold">원하는 맛</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {tasteOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setTasteGoal(option.value);
                              setRecommendation(null);
                            }}
                            className={`rounded-lg border px-3 py-3 text-left ${
                              tasteGoal === option.value
                                ? "border-[#2f6f5f] bg-[#eef5ef] text-[#245647]"
                                : "border-[#d7ded4] bg-white"
                            }`}
                          >
                            <span className="block text-sm font-bold">{option.label}</span>
                            <span className="mt-1 block text-xs text-[#687168]">
                              {option.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="mt-5 rounded-xl border border-[#b8cfbf] bg-[#f1f8f4] p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-[#245647]">
                        <Droplets size={17} /> 총 물량 자동 계산
                      </p>
                      <p className="mt-2 text-xl font-bold text-[#1f463b]">
                        {dose}g × 1:{baseRatio} → {calculatedWater}g
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#5f7468]">
                        선택한 맛의 추천 비율로 총 물량과 단계별 누적 물량을 생성합니다.
                      </p>
                    </div>

                    {preferences?.defaultDrinkStyle === "iced" && (
                      <p className="mt-3 rounded-lg bg-[#fff8ee] px-3 py-2 text-xs leading-5 text-[#704b2d]">
                        ICED 개인화 기록은 HOT과 분리해 저장됩니다. 현재 자동 물량은 따뜻한 추출 기준이며, 아이스용 추출수와 얼음 배분은 다음 단계에서 추가합니다.
                      </p>
                    )}

                    {message && (
                      <p className="mt-4 rounded-lg bg-[#fff8ee] px-3 py-2 text-sm text-[#704b2d]">
                        {message}
                      </p>
                    )}

                    <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <button
                        type="button"
                        onClick={generateRecommendation}
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#2f6f5f] px-4 py-3 text-sm font-bold text-white"
                      >
                        <Sparkles size={18} /> 추천 만들기
                      </button>
                      <button
                        type="button"
                        onClick={saveEnvironment}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2f6f5f] bg-white px-4 py-3 text-xs font-semibold text-[#2f6f5f]"
                      >
                        <Save size={15} /> 기본값 저장
                      </button>
                    </div>
                  </section>

                  {recommendation && selectedBean && selectedGrinder && (
                    <section className="rounded-xl border border-[#c9d7c7] bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#2f6f5f]">추천 결과</p>
                          <h3 className="mt-1 text-lg font-bold">{recommendation.templateName}</h3>
                          <p className="mt-1 text-xs text-[#687168]">
                            {selectedBean.name} · {selectedGrinder.displayName}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#eef5ef] px-2.5 py-1 text-xs font-semibold text-[#2f6f5f]">
                          신뢰도 {recommendation.confidence === "medium" ? "보통" : "참고"}
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
                            <Thermometer size={13} /> 온도
                          </p>
                          <p className="mt-1 font-bold">{recommendation.temperatureCelsius}℃</p>
                        </div>
                        <div className="rounded-lg bg-[#f8faf7] p-3">
                          <p className="flex items-center gap-1 text-xs text-[#687168]">
                            <Gauge size={13} /> 목표 시간
                          </p>
                          <p className="mt-1 font-bold">
                            {formatTime(recommendation.targetTimeMinSeconds)}~{formatTime(recommendation.targetTimeMaxSeconds)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-[#ead9c7] bg-[#fff8ee] p-4">
                        <p className="text-xs font-semibold text-[#8a623d]">추천 분쇄도</p>
                        <p className="mt-2 text-2xl font-bold text-[#51351f]">
                          {recommendation.grinder.displayValue}
                        </p>
                        <p className="mt-1 text-xs text-[#806448]">
                          범위 {recommendation.grinder.displayRange} · {recommendation.grinder.commonDescription}
                        </p>
                        <p className="mt-3 text-xs leading-5 text-[#806448]">
                          {recommendation.grinder.note}
                        </p>
                      </div>

                      <ol className="mt-5 divide-y divide-[#edf1ea] rounded-lg border border-[#d7ded4]">
                        {recommendation.steps.map((step) => (
                          <li key={`${step.label}-${step.startSeconds}`} className="flex gap-3 px-3 py-3">
                            <span className="w-10 shrink-0 text-xs font-semibold text-[#2f6f5f]">
                              {formatTime(step.startSeconds)}
                            </span>
                            <div>
                              <p className="text-sm font-bold">
                                {step.label} · {step.targetWaterGrams}g까지
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[#687168]">{step.cue}</p>
                            </div>
                          </li>
                        ))}
                      </ol>

                      <button
                        type="button"
                        onClick={startTimer}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8a623d] px-4 py-3 text-sm font-bold text-white"
                      >
                        <Play size={18} /> 이 레시피로 타이머 시작
                      </button>

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
