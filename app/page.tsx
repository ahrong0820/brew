"use client";

import {
  Coffee,
  Droplets,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Search,
  SkipForward,
  Thermometer,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type BrewStep = {
  label: string;
  start: number;
  end: number;
  targetWater: number;
  cue: string;
};

type Recipe = {
  id: string;
  name: string;
  origin: string;
  method: string;
  profile: string;
  tags: string[];
  dose: number;
  water: number;
  ratio: string;
  temp: string;
  grind: string;
  totalTime: number;
  notes: string[];
  steps: BrewStep[];
};

const recipes: Recipe[] = [
  {
    id: "v60-daily",
    name: "V60 데일리 밸런스",
    origin: "중배전 블렌드",
    method: "V60 02",
    profile: "단맛, 균형감, 긴 여운",
    tags: ["데일리", "균형", "중배전"],
    dose: 15,
    water: 250,
    ratio: "1:16.7",
    temp: "92C",
    grind: "중간보다 살짝 고운 분쇄",
    totalTime: 150,
    notes: ["첫 물줄기는 중앙에서 낮게", "마지막 30초는 드로다운만 확인"],
    steps: [
      {
        label: "블룸",
        start: 0,
        end: 30,
        targetWater: 40,
        cue: "가루 전체를 적시고 서버를 가볍게 흔들기",
      },
      {
        label: "1차 푸어",
        start: 30,
        end: 60,
        targetWater: 120,
        cue: "중앙에서 바깥으로 천천히 원을 넓히기",
      },
      {
        label: "2차 푸어",
        start: 60,
        end: 105,
        targetWater: 190,
        cue: "수위를 절반 정도 유지하며 균일하게 붓기",
      },
      {
        label: "마무리",
        start: 105,
        end: 150,
        targetWater: 250,
        cue: "중앙 위주로 가늘게 붓고 완전히 빠지기",
      },
    ],
  },
  {
    id: "kalita-sweet",
    name: "칼리타 웨이브 단맛",
    origin: "브라질, 콜롬비아",
    method: "Kalita Wave 185",
    profile: "견과류, 라운드 바디, 낮은 산미",
    tags: ["단맛", "플랫바텀", "중배전"],
    dose: 20,
    water: 300,
    ratio: "1:15",
    temp: "91C",
    grind: "중간 분쇄",
    totalTime: 195,
    notes: ["필터 린싱 후 드리퍼 예열", "평평한 베드를 끝까지 유지"],
    steps: [
      {
        label: "블룸",
        start: 0,
        end: 40,
        targetWater: 50,
        cue: "중앙을 충분히 적시고 40초까지 기다리기",
      },
      {
        label: "1차 푸어",
        start: 40,
        end: 80,
        targetWater: 140,
        cue: "낮은 수위로 부드럽게 원을 그리기",
      },
      {
        label: "2차 푸어",
        start: 80,
        end: 130,
        targetWater: 230,
        cue: "필터 벽을 피하고 중앙 반경 안에서 붓기",
      },
      {
        label: "드로다운",
        start: 130,
        end: 195,
        targetWater: 300,
        cue: "목표 수율까지 채운 뒤 평평하게 빠지기",
      },
    ],
  },
  {
    id: "origami-floral",
    name: "오리가미 라이트 플로럴",
    origin: "에티오피아 워시드",
    method: "Origami + 콘 필터",
    profile: "플로럴, 시트러스, 투명도",
    tags: ["산미", "라이트", "향미"],
    dose: 18,
    water: 270,
    ratio: "1:15",
    temp: "94C",
    grind: "중간보다 고운 분쇄",
    totalTime: 165,
    notes: ["물 온도를 높게 유지", "전체 물줄기는 얇고 빠르게"],
    steps: [
      {
        label: "블룸",
        start: 0,
        end: 35,
        targetWater: 45,
        cue: "전체를 빠르게 적시고 가볍게 스월",
      },
      {
        label: "고수위 푸어",
        start: 35,
        end: 75,
        targetWater: 150,
        cue: "수위를 높여 향미를 열어주기",
      },
      {
        label: "펄스",
        start: 75,
        end: 120,
        targetWater: 225,
        cue: "작은 원으로 2번 나눠 붓기",
      },
      {
        label: "마감",
        start: 120,
        end: 165,
        targetWater: 270,
        cue: "필터 벽을 헹구지 않고 중앙 마감",
      },
    ],
  },
  {
    id: "april-two-pour",
    name: "에이프릴 2푸어 클린컵",
    origin: "케냐, 파나마",
    method: "평저 드리퍼",
    profile: "선명한 산미, 가벼운 질감",
    tags: ["클린컵", "라이트", "2푸어"],
    dose: 12,
    water: 200,
    ratio: "1:16.7",
    temp: "93C",
    grind: "중간 분쇄",
    totalTime: 150,
    notes: ["두 번의 푸어만 사용", "첫 푸어는 향, 두 번째는 균형"],
    steps: [
      {
        label: "1차 푸어",
        start: 0,
        end: 45,
        targetWater: 100,
        cue: "중앙 50g, 외곽 50g 순서로 붓기",
      },
      {
        label: "대기",
        start: 45,
        end: 70,
        targetWater: 100,
        cue: "베드가 절반쯤 내려올 때까지 기다리기",
      },
      {
        label: "2차 푸어",
        start: 70,
        end: 115,
        targetWater: 200,
        cue: "중앙 50g, 외곽 50g으로 마무리",
      },
      {
        label: "드로다운",
        start: 115,
        end: 150,
        targetWater: 200,
        cue: "잔류 물이 빠지면 바로 서버 제거",
      },
    ],
  },
  {
    id: "iced-v60",
    name: "V60 아이스 플래시",
    origin: "과테말라, 에티오피아",
    method: "V60 + 얼음 120g",
    profile: "차가운 과일감, 산뜻한 단맛",
    tags: ["아이스", "산미", "여름"],
    dose: 20,
    water: 180,
    ratio: "1:9 + ice",
    temp: "94C",
    grind: "중간보다 고운 분쇄",
    totalTime: 135,
    notes: ["서버에 얼음 120g 먼저 담기", "추출 직후 서버를 흔들어 냉각"],
    steps: [
      {
        label: "블룸",
        start: 0,
        end: 30,
        targetWater: 45,
        cue: "뜨거운 물로 빠르게 적시고 30초 대기",
      },
      {
        label: "1차 푸어",
        start: 30,
        end: 65,
        targetWater: 110,
        cue: "중앙에서 작은 원으로 추출 농도 만들기",
      },
      {
        label: "2차 푸어",
        start: 65,
        end: 100,
        targetWater: 180,
        cue: "목표 물량까지 가늘고 빠르게 붓기",
      },
      {
        label: "냉각",
        start: 100,
        end: 135,
        targetWater: 180,
        cue: "서버를 돌려 얼음과 추출액 섞기",
      },
    ],
  },
];

const filterOptions = ["전체", "데일리", "라이트", "산미", "단맛", "아이스"];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function scaleValue(value: number, factor: number) {
  return Math.round(value * factor);
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(recipes[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const [dose, setDose] = useState(recipes[0].dose);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  const selectedRecipe =
    recipes.find((recipe) => recipe.id === selectedId) ?? recipes[0];

  const scaleFactor = dose / selectedRecipe.dose;
  const scaledWater = scaleValue(selectedRecipe.water, scaleFactor);
  const totalTime = selectedRecipe.totalTime;

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesFilter =
        filter === "전체" ||
        recipe.tags.some((tag) => tag.toLowerCase() === filter.toLowerCase());
      const searchable = [
        recipe.name,
        recipe.origin,
        recipe.method,
        recipe.profile,
        ...recipe.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchable.includes(normalizedQuery);
    });
  }, [filter, query]);

  const currentStepIndex = useMemo(() => {
    const index = selectedRecipe.steps.findIndex((step) => elapsed < step.end);
    return index === -1 ? selectedRecipe.steps.length - 1 : index;
  }, [elapsed, selectedRecipe.steps]);

  const currentStep = selectedRecipe.steps[currentStepIndex];
  const previousTarget =
    currentStepIndex > 0
      ? selectedRecipe.steps[currentStepIndex - 1].targetWater
      : 0;
  const currentStepProgress =
    currentStep.end === currentStep.start
      ? 1
      : Math.min(
          1,
          Math.max(0, (elapsed - currentStep.start) / (currentStep.end - currentStep.start)),
        );
  const targetWater = scaleValue(currentStep.targetWater, scaleFactor);
  const stepWater = scaleValue(currentStep.targetWater - previousTarget, scaleFactor);
  const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  const remaining = Math.max(0, totalTime - elapsed);

  useEffect(() => {
    if (!running) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = Date.now();
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const lastTick = lastTickRef.current ?? now;
      const delta = (now - lastTick) / 1000;
      lastTickRef.current = now;

      const nextElapsed = Math.min(totalTime, elapsedRef.current + delta);
      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);

      if (nextElapsed >= totalTime) {
        setRunning(false);
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [running, totalTime]);

  function updateElapsed(nextElapsed: number) {
    elapsedRef.current = nextElapsed;
    setElapsed(nextElapsed);
  }

  function selectRecipe(recipe: Recipe) {
    setSelectedId(recipe.id);
    setDose(recipe.dose);
    updateElapsed(0);
    setRunning(false);
  }

  function resetTimer() {
    updateElapsed(0);
    setRunning(false);
  }

  function jumpToNextStep() {
    const nextStep = selectedRecipe.steps[currentStepIndex + 1];

    if (nextStep) {
      updateElapsed(nextStep.start);
      return;
    }

    updateElapsed(totalTime);
    setRunning(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f6f1] text-[#1d211c]">
      <header className="relative isolate overflow-hidden border-b border-black/10 bg-[#20251f] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brewing-hero.png"
          alt="핸드드립 커피 도구가 놓인 작업대"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/78 via-black/50 to-black/12" />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
          <section className="flex min-h-[300px] flex-col justify-between gap-8 py-2 sm:min-h-[360px]">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-white/72">
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Brew Desk
            </div>

            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold leading-[1.16] text-white sm:text-5xl">
                <span className="block sm:inline">핸드드립</span>{" "}
                <span className="block sm:ml-3 sm:inline">레시피 노트</span>
              </h1>
              <div className="mt-7 grid max-w-2xl grid-cols-3 gap-3 text-sm text-white/82">
                <div className="border-l border-white/35 pl-3">
                  <span className="block text-2xl font-semibold text-white">
                    {recipes.length}
                  </span>
                  레시피
                </div>
                <div className="border-l border-white/35 pl-3">
                  <span className="block text-2xl font-semibold text-white">
                    {formatTime(totalTime)}
                  </span>
                  선택 시간
                </div>
                <div className="border-l border-white/35 pl-3">
                  <span className="block text-2xl font-semibold text-white">
                    {selectedRecipe.ratio}
                  </span>
                  비율
                </div>
              </div>
            </div>
          </section>

          <section className="self-end rounded-lg border border-white/18 bg-white/92 p-4 text-[#1d211c] shadow-2xl shadow-black/25 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Now Brewing
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {selectedRecipe.name}
                </h2>
              </div>
              <div className="rounded-lg bg-[#e5eee4] px-3 py-2 text-right text-sm">
                <span className="block text-xs text-[#607064]">남은 시간</span>
                <strong className="font-mono text-xl">{formatTime(remaining)}</strong>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#d9ded6]">
              <div
                className="h-full rounded-full bg-[#2f6f5f]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-[#607064]">원두</span>
                <strong className="block text-lg">{dose}g</strong>
              </div>
              <div>
                <span className="text-[#607064]">물</span>
                <strong className="block text-lg">{scaledWater}g</strong>
              </div>
              <div>
                <span className="text-[#607064]">온도</span>
                <strong className="block text-lg">{selectedRecipe.temp}</strong>
              </div>
            </div>
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:px-8">
        <section className="order-2 space-y-5 lg:order-1">
          <div className="flex flex-col gap-3 rounded-lg border border-[#d7ded4] bg-white p-3 shadow-sm shadow-black/5 md:flex-row md:items-center md:justify-between">
            <label className="relative flex min-w-0 flex-1 items-center">
              <Search className="absolute left-3 h-4 w-4 text-[#607064]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="원두, 도구, 향미 검색"
                className="h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
              />
            </label>

            <div className="flex gap-1 overflow-x-auto rounded-md bg-[#edf1ea] p-1">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`h-9 shrink-0 rounded-md px-3 text-sm font-medium transition ${
                    filter === option
                      ? "bg-[#2f6f5f] text-white shadow-sm"
                      : "text-[#48534b] hover:bg-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredRecipes.map((recipe) => {
              const selected = recipe.id === selectedRecipe.id;

              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => selectRecipe(recipe)}
                  className={`rounded-lg border bg-white p-5 text-left shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-[#2f6f5f] hover:shadow-md ${
                    selected
                      ? "border-[#2f6f5f] ring-2 ring-[#2f6f5f]/18"
                      : "border-[#d7ded4]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#607064]">
                        {recipe.method}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">{recipe.name}</h3>
                    </div>
                    <span className="rounded-md bg-[#eef3ec] px-2.5 py-1 font-mono text-sm text-[#2f6f5f]">
                      {formatTime(recipe.totalTime)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#526055]">
                    {recipe.profile}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md bg-[#f4f6f1] p-3">
                      <Scale className="mb-2 h-4 w-4 text-[#2f6f5f]" aria-hidden="true" />
                      <span className="block text-[#607064]">원두</span>
                      <strong>{recipe.dose}g</strong>
                    </div>
                    <div className="rounded-md bg-[#f4f6f1] p-3">
                      <Droplets className="mb-2 h-4 w-4 text-[#2f6f5f]" aria-hidden="true" />
                      <span className="block text-[#607064]">물</span>
                      <strong>{recipe.water}g</strong>
                    </div>
                    <div className="rounded-md bg-[#f4f6f1] p-3">
                      <Thermometer className="mb-2 h-4 w-4 text-[#2f6f5f]" aria-hidden="true" />
                      <span className="block text-[#607064]">온도</span>
                      <strong>{recipe.temp}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-[#d7ded4] px-2.5 py-1 text-xs font-medium text-[#526055]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="order-1 space-y-4 lg:sticky lg:top-6 lg:order-2 lg:self-start">
          <section className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Timer
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{currentStep.label}</h2>
              </div>
              <Timer className="h-6 w-6 text-[#2f6f5f]" aria-hidden="true" />
            </div>

            <div className="mt-6 rounded-lg bg-[#1f251f] p-5 text-white">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="text-sm text-white/62">경과</span>
                  <strong className="block font-mono text-5xl">
                    {formatTime(elapsed)}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white/62">목표</span>
                  <strong className="block font-mono text-2xl">
                    {formatTime(totalTime)}
                  </strong>
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/16">
                <div
                  className="h-full rounded-full bg-[#8bc9a4]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRunning((current) => !current)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-[#1f251f] transition hover:bg-[#e5eee4]"
                >
                  {running ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                  {running ? "일시정지" : "시작"}
                </button>
                <button
                  type="button"
                  onClick={jumpToNextStep}
                  aria-label="다음 단계"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
                >
                  <SkipForward className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  aria-label="초기화"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                <span className="text-sm text-[#607064]">원두량</span>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="8"
                    max="40"
                    step="1"
                    value={dose}
                    onChange={(event) => setDose(Number(event.target.value))}
                    className="h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-lg font-semibold outline-none focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                  />
                  <span className="text-sm font-semibold text-[#607064]">g</span>
                </div>
              </label>
              <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                <span className="text-sm text-[#607064]">총 물량</span>
                <strong className="mt-2 block text-2xl">{scaledWater}g</strong>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm text-[#607064]">현재 물량</span>
                  <strong className="block text-3xl">{targetWater}g</strong>
                </div>
                <div className="text-right">
                  <span className="text-sm text-[#607064]">이번 단계</span>
                  <strong className="block text-2xl">+{stepWater}g</strong>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#d9ded6]">
                <div
                  className="h-full rounded-full bg-[#c95b3d]"
                  style={{ width: `${currentStepProgress * 100}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#526055]">{currentStep.cue}</p>
            </div>
          </section>

          <section className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Recipe
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {selectedRecipe.origin}
                </h2>
              </div>
              <span className="rounded-md bg-[#eef3ec] px-3 py-1 font-mono text-sm text-[#2f6f5f]">
                {selectedRecipe.ratio}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-[#f4f6f1] p-3">
                <dt className="text-[#607064]">도구</dt>
                <dd className="mt-1 font-semibold">{selectedRecipe.method}</dd>
              </div>
              <div className="rounded-md bg-[#f4f6f1] p-3">
                <dt className="text-[#607064]">분쇄</dt>
                <dd className="mt-1 font-semibold">{selectedRecipe.grind}</dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              {selectedRecipe.steps.map((step, index) => {
                const active = index === currentStepIndex;
                const completed = elapsed >= step.end;

                return (
                  <button
                    key={`${selectedRecipe.id}-${step.label}`}
                    type="button"
                    onClick={() => updateElapsed(step.start)}
                    className={`grid w-full grid-cols-[58px_1fr_62px] items-center gap-3 rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-[#2f6f5f] bg-[#eef5ef]"
                        : completed
                          ? "border-[#d7ded4] bg-[#f8faf6] text-[#607064]"
                          : "border-[#d7ded4] bg-white"
                    }`}
                  >
                    <span className="font-mono text-sm">
                      {formatTime(step.start)}
                    </span>
                    <span>
                      <strong className="block text-sm">{step.label}</strong>
                      <span className="text-xs text-[#607064]">
                        {formatTime(step.end - step.start)}
                      </span>
                    </span>
                    <span className="text-right font-semibold">
                      {scaleValue(step.targetWater, scaleFactor)}g
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="mt-5 space-y-2 text-sm leading-6 text-[#526055]">
              {selectedRecipe.notes.map((note) => (
                <li key={note} className="border-l-2 border-[#8bc9a4] pl-3">
                  {note}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
