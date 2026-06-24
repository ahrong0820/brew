"use client";

import {
  Bell,
  ChevronLeft,
  Check,
  Coffee,
  Droplets,
  Heart,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Search,
  SkipForward,
  Thermometer,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const heroImageSrc = `${basePath}/brewing-hero.png`;

type WaterAmount = number | { min: number; max: number };

type BrewStep = {
  label: string;
  start: number;
  end: number;
  targetWater: number;
  displayTargetWater?: WaterAmount;
  displayStepWater?: WaterAmount;
  cue: string;
};

type DraftStep = {
  label: string;
  duration: number;
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
  brewWater?: number;
  bypassWater?: WaterAmount;
  finalWater?: WaterAmount;
  ratio: string;
  temp: string;
  grind: string;
  totalTime: number;
  notes: string[];
  steps: BrewStep[];
};

const customRecipesStorageKey = "coffee-custom-recipes";

const defaultDraftSteps: DraftStep[] = [
  {
    label: "블루밍",
    duration: 40,
    targetWater: 40,
    cue: "가루 전체를 적시고 향을 열기",
  },
  {
    label: "1차 추출",
    duration: 35,
    targetWater: 120,
    cue: "중앙부터 바깥쪽으로 천천히 붓기",
  },
  {
    label: "2차 추출",
    duration: 35,
    targetWater: 200,
    cue: "수위를 안정적으로 유지하며 붓기",
  },
  {
    label: "마무리",
    duration: 50,
    targetWater: 300,
    cue: "목표 물량까지 채우고 드리퍼 제거 준비",
  },
];

const recipes: Recipe[] = [
  {
    id: "tetsu-46",
    name: "테츠 카스야 4:6 기본형",
    origin: "바리스타 공개 레시피",
    method: "V60",
    profile: "균형감, 클린컵, 조절 가능한 단맛과 산미",
    tags: ["V60", "클래식", "라이트"],
    dose: 20,
    water: 300,
    ratio: "1:15",
    temp: "92C",
    grind: "중굵은 분쇄",
    totalTime: 210,
    notes: ["전반 40%로 맛의 방향을 잡고 후반 60%로 농도를 맞춤", "물량 변경 시 각 푸어량도 함께 스케일"],
    steps: [
      {
        label: "블루밍",
        start: 0,
        end: 45,
        targetWater: 60,
        cue: "가루를 충분히 적시고 45초까지 기다리기",
      },
      {
        label: "1차 추출",
        start: 45,
        end: 90,
        targetWater: 120,
        cue: "천천히 원을 그리며 120g까지 붓기",
      },
      {
        label: "2차 추출",
        start: 90,
        end: 135,
        targetWater: 180,
        cue: "중앙에서 바깥쪽으로 물줄기를 넓히기",
      },
      {
        label: "3차 추출",
        start: 135,
        end: 180,
        targetWater: 240,
        cue: "수위를 안정적으로 유지하며 240g까지 붓기",
      },
      {
        label: "4차 추출",
        start: 180,
        end: 210,
        targetWater: 300,
        cue: "마지막 60g을 채우고 3분 30초에 드리퍼 제거",
      },
    ],
  },
  {
    id: "anstar-6888",
    name: "안스타 6888",
    origin: "바리스타 공개 레시피",
    method: "V60",
    profile: "굵은 분쇄, 향미 표현, 반복하기 쉬운 펄스",
    tags: ["V60", "국내", "향미"],
    dose: 20,
    water: 300,
    ratio: "1:15",
    temp: "94C",
    grind: "굵은 분쇄",
    totalTime: 150,
    notes: [
      "60g 블룸 뒤 80g씩 세 번 나누는 단순한 리듬",
      "표시 시간은 기준이며, 이전 물이 대부분 빠진 뒤 다음 푸어를 시작합니다.",
    ],
    steps: [
      {
        label: "블루밍",
        start: 0,
        end: 30,
        targetWater: 60,
        cue: "커피 가루를 충분히 적시기",
      },
      {
        label: "1차 추출",
        start: 30,
        end: 60,
        targetWater: 140,
        cue: "굵은 물줄기로 140g까지 붓고 빠짐 확인",
      },
      {
        label: "2차 추출",
        start: 60,
        end: 90,
        targetWater: 220,
        cue: "동일한 속도로 220g까지 붓기",
      },
      {
        label: "3차 추출",
        start: 90,
        end: 120,
        targetWater: 300,
        cue: "마지막 80g을 채워 총 300g 맞추기",
      },
      {
        label: "완료",
        start: 120,
        end: 150,
        targetWater: 300,
        cue: "모든 물이 빠질 때까지 기다리기",
      },
    ],
  },
  {
    id: "jis-4666",
    name: "정인성 4666 오리지널",
    origin: "바리스타 공개 레시피",
    method: "V60",
    profile: "약배전 스페셜티, 선명한 향, 안정적인 분할",
    tags: ["V60", "국내", "라이트"],
    dose: 20,
    water: 320,
    brewWater: 220,
    bypassWater: 100,
    finalWater: 320,
    ratio: "1:16",
    temp: "92C",
    grind: "중간보다 굵은 분쇄",
    totalTime: 160,
    notes: ["40g 뜸 이후 60g씩 세 번 추출하는 4666 구조", "약배전 원두의 맛과 향 표현에 초점"],
    steps: [
      {
        label: "뜸들이기",
        start: 0,
        end: 40,
        targetWater: 40,
        cue: "가루 전체를 부드럽게 적시기",
      },
      {
        label: "1차 추출",
        start: 40,
        end: 70,
        targetWater: 100,
        cue: "중앙부터 바깥쪽으로 원을 그리며 붓기",
      },
      {
        label: "2차 추출",
        start: 70,
        end: 100,
        targetWater: 160,
        cue: "1차와 같은 흐름으로 160g까지 붓기",
      },
      {
        label: "3차 추출",
        start: 100,
        end: 130,
        targetWater: 220,
        cue: "마지막 추출수를 붓고 흐름을 안정화",
      },
      {
        label: "후가수",
        start: 130,
        end: 160,
        targetWater: 220,
        displayTargetWater: 320,
        displayStepWater: 100,
        cue: "추출 후 뜨거운 물 100g을 별도로 더해 농도 조절",
      },
    ],
  },
  {
    id: "jis-ver2-hot",
    name: "정인성 국룰 Ver 2.0 HOT",
    origin: "바리스타 공개 레시피",
    method: "V60",
    profile: "긴 뜸, 안정적인 단맛, 후가수 밸런스",
    tags: ["V60", "국내", "단맛"],
    dose: 18,
    water: 300,
    brewWater: 220,
    bypassWater: 80,
    finalWater: 300,
    ratio: "1:16",
    temp: "90℃ 이상",
    grind: "중간 분쇄",
    totalTime: 180,
    notes: ["4666 구조를 바탕으로 뜸 시간을 늘린 버전", "마지막 80g은 추출 후 뜨거운 물로 농도 조절"],
    steps: [
      {
        label: "뜸들이기",
        start: 0,
        end: 40,
        targetWater: 40,
        cue: "40초간 충분히 뜸을 들여 가스 배출",
      },
      {
        label: "1차 추출",
        start: 40,
        end: 70,
        targetWater: 100,
        cue: "30초 동안 100g까지 붓기",
      },
      {
        label: "2차 추출",
        start: 70,
        end: 100,
        targetWater: 160,
        cue: "동일한 속도로 160g까지 붓기",
      },
      {
        label: "3차 추출",
        start: 100,
        end: 160,
        targetWater: 220,
        cue: "마지막 추출수를 채우고 드로다운",
      },
      {
        label: "희석",
        start: 160,
        end: 180,
        targetWater: 220,
        displayTargetWater: 300,
        displayStepWater: 80,
        cue: "추출 원액에 뜨거운 물 80g을 더해 농도 조절",
      },
    ],
  },
  {
    id: "yong-light",
    name: "용챔 라이트로스트 15g",
    origin: "바리스타 공개 레시피",
    method: "Hario Alpha",
    profile: "꽃향, 과일감, 빠른 굵은 물줄기",
    tags: ["국내", "라이트", "향미"],
    dose: 15,
    water: 230,
    ratio: "1:15.3",
    temp: "92~93℃",
    grind: "라이트로스트용 중간 분쇄",
    totalTime: 180,
    notes: [
      "40초 뜸 뒤 굵은 물줄기로 빠르게 추출",
      "목표 추출 시간은 2:30-3:00이며, 2:30부터 완료할 수 있습니다.",
    ],
    steps: [
      {
        label: "뜸들이기",
        start: 0,
        end: 40,
        targetWater: 40,
        cue: "커피의 약 2.5배 물로 충분히 불리기",
      },
      {
        label: "1차 푸어링",
        start: 40,
        end: 75,
        targetWater: 110,
        cue: "굵은 물줄기로 빠르게 110g까지 붓기",
      },
      {
        label: "2차 푸어링",
        start: 75,
        end: 105,
        targetWater: 190,
        cue: "가장 굵은 물줄기로 190g까지 템포 유지",
      },
      {
        label: "3차 푸어링",
        start: 105,
        end: 180,
        targetWater: 230,
        cue: "가느다란 물줄기로 한 바퀴 후 센터 푸어, 2분 30초~3분 사이 추출 종료",
      },
    ],
  },
  {
    id: "switch-devil",
    name: "테츠 카스야 악마의 레시피",
    origin: "바리스타 공개 레시피",
    method: "Hario Switch",
    profile: "여과와 침출, 온도 전환, 높은 단맛",
    tags: ["스위치", "침출", "단맛"],
    dose: 20,
    water: 280,
    ratio: "1:14",
    temp: "약 90℃ -> 약 70℃",
    grind: "중간보다 약간 고운 분쇄",
    totalTime: 180,
    notes: ["초반은 약 90℃ 여과식, 후반은 약 70℃ 침출식으로 전환", "스위치 오픈/클로즈 타이밍을 단계에 표시"],
    steps: [
      {
        label: "뜸들이기",
        start: 0,
        end: 30,
        targetWater: 60,
        cue: "스위치를 연 상태에서 약 90℃ 물로 60g 붓기",
      },
      {
        label: "1차 여과",
        start: 30,
        end: 75,
        targetWater: 120,
        cue: "같은 온도의 물로 누적 120g까지 붓기",
      },
      {
        label: "스위치 닫기",
        start: 75,
        end: 105,
        targetWater: 280,
        cue: "스위치를 닫고 약 70℃ 물로 누적 280g까지 붓기",
      },
      {
        label: "추출 오픈",
        start: 105,
        end: 180,
        targetWater: 280,
        cue: "1분 45초 지점에 스위치를 열어 여과하고 3분에 추출 종료",
      },
    ],
  },
  {
    id: "signature-cone",
    name: "시그니쳐 로스터스 콘 필터 – 공개본",
    origin: "공개 레시피 기준",
    method: "V60",
    profile: "콘 필터, 3회 스파이럴 푸어, 깔끔한 핫 브루",
    tags: ["V60", "핫", "클린컵"],
    dose: 14,
    water: 210,
    ratio: "1:15",
    temp: "93C",
    grind: "1000-1100um",
    totalTime: 150,
    notes: ["30초 뜸 뒤 70g, 50g, 50g 스파이럴 푸어", "2분에서 2분 30초 사이 드리퍼 제거"],
    steps: [
      {
        label: "뜸들이기",
        start: 0,
        end: 30,
        targetWater: 40,
        cue: "스파이럴 푸어로 전체를 적시기",
      },
      {
        label: "1차 추출",
        start: 30,
        end: 60,
        targetWater: 110,
        cue: "첫 푸어 70g을 스파이럴로 붓기",
      },
      {
        label: "2차 추출",
        start: 60,
        end: 90,
        targetWater: 160,
        cue: "두 번째 푸어 50g 추가",
      },
      {
        label: "3차 추출",
        start: 90,
        end: 120,
        targetWater: 210,
        cue: "마지막 50g을 스파이럴로 마무리",
      },
      {
        label: "완료",
        start: 120,
        end: 150,
        targetWater: 210,
        cue: "2분~2분 30초 사이 드리퍼 제거",
      },
    ],
  },
  {
    id: "deepblue-v60",
    name: "딥블루레이크 V60 HOT – 15g/240g 버전",
    origin: "바리스타 공개 레시피",
    method: "Hario V60",
    profile: "1:16, 4-5회 분할, 안정적인 홈 브루",
    tags: ["V60", "핫", "국내"],
    dose: 15,
    water: 240,
    ratio: "1:16",
    temp: "93C",
    grind: "850-900um",
    totalTime: 170,
    notes: ["50g 단위로 나누어 붓고 마지막은 40g으로 마감", "총 추출 시간은 2분 40초 전후를 목표"],
    steps: [
      {
        label: "뜸들이기",
        start: 0,
        end: 30,
        targetWater: 50,
        cue: "50g의 물을 골고루 붓고 30초 대기",
      },
      {
        label: "1차 추출",
        start: 30,
        end: 60,
        targetWater: 100,
        cue: "50g 추가",
      },
      {
        label: "2차 추출",
        start: 60,
        end: 90,
        targetWater: 150,
        cue: "다시 50g 추가",
      },
      {
        label: "3차 추출",
        start: 90,
        end: 120,
        targetWater: 200,
        cue: "수위를 보며 200g까지 붓기",
      },
      {
        label: "마무리",
        start: 120,
        end: 170,
        targetWater: 240,
        cue: "마지막 40g을 붓고 물이 모두 빠질 때까지 기다리기",
      },
    ],
  },
  {
    id: "hoffmann-clever-water-first",
    name: "제임스 호프만 클레버",
    origin: "James Hoffmann",
    method: "Clever Dripper",
    profile: "물 먼저, 빠른 드로다운, 깨끗한 단맛",
    tags: ["클레버", "침출", "라이트", "클린컵"],
    dose: 15,
    water: 250,
    ratio: "1:16.7",
    temp: "끓인 직후의 물",
    grind: "중간보다 약간 고운 분쇄",
    totalTime: 240,
    notes: [
      "물을 먼저 넣고 커피를 나중에 넣어 막힘을 줄이는 방식",
      "맛이 비거나 약하면 조금 더 곱게, 쓰거나 무거우면 조금 더 굵게 조절",
    ],
    steps: [
      {
        label: "물 먼저",
        start: 0,
        end: 10,
        targetWater: 250,
        cue: "린싱한 클레버에 물 250g을 먼저 붓기",
      },
      {
        label: "커피 투입",
        start: 10,
        end: 25,
        targetWater: 250,
        cue: "분쇄한 커피를 넣고 모든 가루가 젖도록 가볍게 젓기",
      },
      {
        label: "침출",
        start: 25,
        end: 145,
        targetWater: 250,
        cue: "그대로 두어 2분간 우려내기",
      },
      {
        label: "크러스트 깨기",
        start: 145,
        end: 155,
        targetWater: 250,
        cue: "숟가락으로 표면을 한 번 저어 가루를 가라앉히기",
      },
      {
        label: "가라앉히기",
        start: 155,
        end: 185,
        targetWater: 250,
        cue: "30초 기다려 커피층을 안정시키기",
      },
      {
        label: "드로다운",
        start: 185,
        end: 240,
        targetWater: 250,
        cue: "컵이나 서버 위에 올려 추출액을 내려받기",
      },
    ],
  },
  {
    id: "jis-clever-112",
    name: "정인성 클레버 1:12",
    origin: "정인성 바리스타",
    method: "Mr. Clever",
    profile: "묵직한 바디, 진한 침출, 후가수 밸런스",
    tags: ["클레버", "침출", "국내", "단맛"],
    dose: 20,
    water: 300,
    brewWater: 240,
    bypassWater: { min: 60, max: 80 },
    finalWater: { min: 300, max: 320 },
    ratio: "1:12 / 약 1:15~1:16",
    temp: "96℃",
    grind: "중간보다 살짝 굵은 분쇄",
    totalTime: 210,
    notes: [
      "클레버 안에서는 240g으로 진하게 추출한 뒤 뜨거운 물로 농도 조절",
      "후가수는 60-80g 범위에서 취향에 맞게 조절",
    ],
    steps: [
      {
        label: "뜸들이기",
        start: 0,
        end: 30,
        targetWater: 40,
        cue: "물 40g을 붓고 잘 저어 30초간 뜸들이기",
      },
      {
        label: "본 물 붓기",
        start: 30,
        end: 150,
        targetWater: 240,
        cue: "물 200g을 추가하고 잘 저은 뒤 뚜껑 닫기",
      },
      {
        label: "드로다운",
        start: 150,
        end: 210,
        targetWater: 240,
        cue: "서버 위에 올려 약 1분 동안 내려받기",
      },
      {
        label: "농도 조절",
        start: 210,
        end: 210,
        targetWater: 240,
        displayTargetWater: { min: 300, max: 320 },
        displayStepWater: { min: 60, max: 80 },
        cue: "뜨거운 물 60-80g을 더해 마시기 좋은 농도로 맞추기",
      },
    ],
  },
];

const filterOptions = [
  "전체",
  "즐겨찾기",
  "나만의 레시피",
  "V60",
  "클레버",
  "스위치",
  "라이트",
  "단맛",
];

function getStoredFavorites() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem("coffee-recipe-favorites");
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function createDefaultDraftSteps() {
  return defaultDraftSteps.map((step) => ({ ...step }));
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function formatRatio(dose: number, water: number) {
  const ratio = water / dose;
  return `1:${ratio.toFixed(1).replace(".0", "")}`;
}

function buildBrewSteps(draftSteps: DraftStep[]) {
  let cursor = 0;
  let previousTargetWater = 0;

  return draftSteps.map((step, index) => {
    const duration = clampNumber(step.duration, 5, 360);
    const start = cursor;
    const end = cursor + duration;
    const targetWater = Math.max(
      previousTargetWater,
      clampNumber(step.targetWater, 0, 1200),
    );
    const brewStep = {
      label: step.label.trim() || `${index + 1}단계`,
      start,
      end,
      targetWater,
      cue: step.cue.trim() || "다음 단계로 넘어가기 전 흐름을 확인",
    };

    cursor = end;
    previousTargetWater = targetWater;
    return brewStep;
  });
}

function getStoredCustomRecipes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(customRecipesStorageKey);
    const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((value): value is Recipe => {
      if (typeof value !== "object" || value === null) {
        return false;
      }

      const candidate = value as Partial<Recipe>;

      return (
        typeof candidate.id === "string" &&
        candidate.id.startsWith("custom-") &&
        typeof candidate.name === "string" &&
        typeof candidate.dose === "number" &&
        typeof candidate.water === "number" &&
        typeof candidate.totalTime === "number" &&
        Array.isArray(candidate.tags) &&
        Array.isArray(candidate.notes) &&
        Array.isArray(candidate.steps) &&
        candidate.steps.length > 0
      );
    });
  } catch {
    return [];
  }
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function scaleValue(value: number, factor: number) {
  return Math.round(value * factor);
}

function formatWaterAmount(
  amount: WaterAmount,
  factor = 1,
) {
  if (typeof amount === "number") {
    return `${scaleValue(amount, factor)}g`;
  }

  return `${scaleValue(amount.min, factor)}-${scaleValue(amount.max, factor)}g`;
}

function playStepTone() {
  const audioWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextClass = window.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

function vibrateStepCue() {
  if (typeof navigator === "undefined") {
    return;
  }

  const vibrationNavigator = navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean;
  };

  vibrationNavigator.vibrate?.([80, 40, 80]);
}

function runSmartAlert() {
  playStepTone();
  vibrateStepCue();
}

export default function Home() {
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [selectedId, setSelectedId] = useState(recipes[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const [dose, setDose] = useState(recipes[0].dose);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [draftName, setDraftName] = useState("오전용 V60 레시피");
  const [draftMethod, setDraftMethod] = useState("V60");
  const [draftProfile, setDraftProfile] = useState("직접 만든 추출 흐름");
  const [draftDose, setDraftDose] = useState(20);
  const [draftTemp, setDraftTemp] = useState("92C");
  const [draftGrind, setDraftGrind] = useState("중간 분쇄");
  const [draftSteps, setDraftSteps] =
    useState<DraftStep[]>(createDefaultDraftSteps);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const previousStepIndexRef = useRef(0);
  const completionPlayedRef = useRef(false);
  const allRecipes = useMemo(
    () => [...customRecipes, ...recipes],
    [customRecipes],
  );

  const selectedRecipe =
    allRecipes.find((recipe) => recipe.id === selectedId) ?? allRecipes[0];

  const scaleFactor = dose / selectedRecipe.dose;
  const scaledWater = scaleValue(selectedRecipe.water, scaleFactor);
  const scaledFinalWater = formatWaterAmount(
    selectedRecipe.finalWater ?? selectedRecipe.water,
    scaleFactor,
  );
  const totalTime = selectedRecipe.totalTime;

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allRecipes.filter((recipe) => {
      const matchesFilter =
        filter === "전체" ||
        (filter === "즐겨찾기" && favoriteIds.includes(recipe.id)) ||
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
  }, [allRecipes, favoriteIds, filter, query]);

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
  const targetWater = formatWaterAmount(
    currentStep.displayTargetWater ?? currentStep.targetWater,
    scaleFactor,
  );
  const stepWater = formatWaterAmount(
    currentStep.displayStepWater ?? currentStep.targetWater - previousTarget,
    scaleFactor,
  );
  const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  const remaining = Math.max(0, totalTime - elapsed);
  const selectedIsFavorite = favoriteIds.includes(selectedRecipe.id);
  const lastDraftStep = draftSteps[draftSteps.length - 1];
  const draftTotalWater = lastDraftStep?.targetWater ?? 0;
  const draftTotalTime = draftSteps.reduce(
    (total, step) => total + clampNumber(step.duration, 5, 360),
    0,
  );

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

      if (
        elapsedRef.current < totalTime &&
        nextElapsed >= totalTime &&
        !completionPlayedRef.current
      ) {
        completionPlayedRef.current = true;

        if (alertsEnabled) {
          runSmartAlert();
        }
      }

      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);

      if (nextElapsed >= totalTime) {
        setRunning(false);
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [alertsEnabled, running, totalTime]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFavoriteIds(getStoredFavorites());
      setCustomRecipes(getStoredCustomRecipes());
      setStorageLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    window.localStorage.setItem(
      "coffee-recipe-favorites",
      JSON.stringify(favoriteIds),
    );
  }, [favoriteIds, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    window.localStorage.setItem(
      customRecipesStorageKey,
      JSON.stringify(customRecipes),
    );
  }, [customRecipes, storageLoaded]);

  useEffect(() => {
    if (!running) {
      previousStepIndexRef.current = currentStepIndex;
      return;
    }

    if (
      alertsEnabled &&
      currentStepIndex !== previousStepIndexRef.current &&
      currentStepIndex > 0
    ) {
      runSmartAlert();
    }

    previousStepIndexRef.current = currentStepIndex;
  }, [alertsEnabled, currentStepIndex, running]);

  function updateElapsed(nextElapsed: number) {
    if (nextElapsed < totalTime) {
      completionPlayedRef.current = false;
    }

    elapsedRef.current = nextElapsed;
    setElapsed(nextElapsed);
  }

  function selectRecipe(recipe: Recipe) {
    setSelectedId(recipe.id);
    setDose(recipe.dose);
    updateElapsed(0);
    setRunning(false);
  }

  function toggleFavorite(recipeId: string) {
    setFavoriteIds((currentIds) =>
      currentIds.includes(recipeId)
        ? currentIds.filter((id) => id !== recipeId)
        : [...currentIds, recipeId],
    );
  }

  function updateDraftStep(index: number, patch: Partial<DraftStep>) {
    setDraftSteps((currentSteps) =>
      currentSteps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
      ),
    );
  }

  function addDraftStep() {
    const lastStep = draftSteps[draftSteps.length - 1];
    const nextIndex = draftSteps.length + 1;

    setDraftSteps((currentSteps) => [
      ...currentSteps,
      {
        label: `${nextIndex}차 추출`,
        duration: 30,
        targetWater: (lastStep?.targetWater ?? 0) + 60,
        cue: "목표 물량까지 일정하게 붓기",
      },
    ]);
  }

  function removeDraftStep(index: number) {
    setDraftSteps((currentSteps) =>
      currentSteps.length === 1
        ? currentSteps
        : currentSteps.filter((_, stepIndex) => stepIndex !== index),
    );
  }

  function resetDraft() {
    setDraftName("오전용 V60 레시피");
    setDraftMethod("V60");
    setDraftProfile("직접 만든 추출 흐름");
    setDraftDose(20);
    setDraftTemp("92C");
    setDraftGrind("중간 분쇄");
    setDraftSteps(createDefaultDraftSteps());
  }

  function saveCustomRecipe() {
    const safeDose = clampNumber(draftDose, 8, 60);
    const steps = buildBrewSteps(draftSteps);
    const lastStep = steps[steps.length - 1];
    const water = lastStep?.targetWater ?? 0;
    const totalTime = lastStep?.end ?? 0;
    const method = draftMethod.trim() || "핸드드립";
    const nextCustomRecipeIndex =
      customRecipes.reduce((highestIndex, recipe) => {
        const recipeIndex = Number(recipe.id.replace("custom-", ""));
        return Number.isFinite(recipeIndex)
          ? Math.max(highestIndex, recipeIndex)
          : highestIndex;
      }, 0) + 1;
    const customRecipe: Recipe = {
      id: `custom-${nextCustomRecipeIndex}`,
      name: draftName.trim() || "나만의 레시피",
      origin: "나만의 레시피",
      method,
      profile: draftProfile.trim() || "직접 만든 추출 흐름",
      tags: ["나만의 레시피", method],
      dose: safeDose,
      water,
      ratio: formatRatio(safeDose, water),
      temp: draftTemp.trim() || "92C",
      grind: draftGrind.trim() || "중간 분쇄",
      totalTime,
      notes: [
        "브라우저에 저장되는 나만의 레시피",
        "단계별 시간과 목표 물량을 타이머에서 바로 따라갈 수 있습니다.",
      ],
      steps,
    };

    setCustomRecipes((currentRecipes) => [customRecipe, ...currentRecipes]);
    setSelectedId(customRecipe.id);
    setDose(customRecipe.dose);
    setFilter("나만의 레시피");
    updateElapsed(0);
    setRunning(false);
  }

  function deleteCustomRecipe(recipeId: string) {
    setCustomRecipes((currentRecipes) =>
      currentRecipes.filter((recipe) => recipe.id !== recipeId),
    );
    setFavoriteIds((currentIds) => currentIds.filter((id) => id !== recipeId));

    if (selectedId === recipeId) {
      selectRecipe(recipes[0]);
    }
  }

  function resetTimer() {
    updateElapsed(0);
    setRunning(false);
  }

  function jumpToPreviousStep() {
    const previousStep = selectedRecipe.steps[currentStepIndex - 1];

    if (previousStep) {
      updateElapsed(previousStep.start);
      return;
    }

    updateElapsed(0);
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
          src={heroImageSrc}
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
                    {allRecipes.length}
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
                <span className="text-[#607064]">
                  {selectedRecipe.finalWater ? "최종 물" : "물"}
                </span>
                <strong className="block text-lg">{scaledFinalWater}</strong>
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
        <section className="order-2 min-w-0 space-y-5 lg:order-1">
          <div className="flex flex-col gap-3 rounded-lg border border-[#d7ded4] bg-white p-3 shadow-sm shadow-black/5">
            <label className="relative flex min-w-0 flex-1 items-center">
              <Search className="absolute left-3 h-4 w-4 text-[#607064]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="원두, 도구, 향미 검색"
                className="h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
              />
            </label>

            <div className="flex min-w-0 gap-1 overflow-x-auto rounded-md bg-[#edf1ea] p-1">
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
              const favorite = favoriteIds.includes(recipe.id);

              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => selectRecipe(recipe)}
                  className={`min-w-0 rounded-lg border bg-white p-5 text-left shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-[#2f6f5f] hover:shadow-md ${
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
                    <div className="flex shrink-0 items-center gap-2">
                      {favorite ? (
                        <Heart
                          className="h-4 w-4 fill-[#c95b3d] text-[#c95b3d]"
                          aria-label="즐겨찾기"
                        />
                      ) : null}
                      <span className="rounded-md bg-[#eef3ec] px-2.5 py-1 font-mono text-sm text-[#2f6f5f]">
                        {formatTime(recipe.totalTime)}
                      </span>
                    </div>
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
                      <strong>
                        {formatWaterAmount(recipe.finalWater ?? recipe.water)}
                      </strong>
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

          <section className="rounded-lg border border-[#d7ded4] bg-white p-5 shadow-sm shadow-black/5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607064]">
                  Custom Recipe
                </p>
                <h2 className="mt-2 text-xl font-semibold">나만의 레시피</h2>
              </div>
              <span className="rounded-md bg-[#eef3ec] px-3 py-1 text-sm font-semibold text-[#2f6f5f]">
                {customRecipes.length}개 저장됨
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">레시피 이름</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">드리퍼</span>
                <input
                  value={draftMethod}
                  onChange={(event) => setDraftMethod(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">원두량</span>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="8"
                    max="60"
                    value={draftDose}
                    onChange={(event) => setDraftDose(Number(event.target.value))}
                    className="h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                  />
                  <span className="text-sm font-semibold text-[#607064]">g</span>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">물 온도</span>
                <input
                  value={draftTemp}
                  onChange={(event) => setDraftTemp(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">분쇄도</span>
                <input
                  value={draftGrind}
                  onChange={(event) => setDraftGrind(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#607064]">맛 프로필</span>
                <input
                  value={draftProfile}
                  onChange={(event) => setDraftProfile(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
                />
              </label>
            </div>

            <div className="mt-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-[#1d211c]">추출 단계</h3>
                <span className="font-mono text-sm text-[#607064]">
                  {formatTime(draftTotalTime)} · {draftTotalWater}g ·{" "}
                  {formatRatio(clampNumber(draftDose, 8, 60), draftTotalWater)}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {draftSteps.map((step, index) => (
                  <div
                    key={`draft-step-${index}`}
                    className="grid gap-2 rounded-md border border-[#d7ded4] bg-[#f8faf6] p-3 lg:grid-cols-[minmax(110px,1fr)_92px_100px_minmax(150px,1.35fr)_40px]"
                  >
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">단계</span>
                      <input
                        value={step.label}
                        onChange={(event) =>
                          updateDraftStep(index, { label: event.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">시간</span>
                      <input
                        type="number"
                        min="5"
                        max="360"
                        value={step.duration}
                        onChange={(event) =>
                          updateDraftStep(index, {
                            duration: Number(event.target.value),
                          })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">목표 물</span>
                      <input
                        type="number"
                        min="0"
                        max="1200"
                        value={step.targetWater}
                        onChange={(event) =>
                          updateDraftStep(index, {
                            targetWater: Number(event.target.value),
                          })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-[#607064]">큐</span>
                      <input
                        value={step.cue}
                        onChange={(event) =>
                          updateDraftStep(index, { cue: event.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-md border border-[#d7ded4] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeDraftStep(index)}
                      disabled={draftSteps.length === 1}
                      aria-label={`${step.label} 삭제`}
                      className="flex h-10 w-10 items-center justify-center self-end rounded-md border border-[#d7ded4] text-[#607064] transition hover:border-[#c95b3d] hover:text-[#c95b3d] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={addDraftStep}
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#2f6f5f] transition hover:bg-[#eef5ef]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  단계 추가
                </button>
                <button
                  type="button"
                  onClick={saveCustomRecipe}
                  className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#2f6f5f] px-4 text-sm font-semibold text-white transition hover:bg-[#255c4f]"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  레시피 저장
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="flex h-10 items-center justify-center rounded-md border border-[#d7ded4] bg-white px-4 text-sm font-semibold text-[#607064] transition hover:bg-[#f4f6f1]"
                >
                  초기화
                </button>
              </div>
            </div>

            {customRecipes.length > 0 ? (
              <div className="mt-5 border-t border-[#d7ded4] pt-4">
                <h3 className="text-sm font-semibold text-[#1d211c]">
                  저장된 레시피
                </h3>
                <div className="mt-3 space-y-2">
                  {customRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center gap-2 rounded-md bg-[#f8faf6] p-2"
                    >
                      <button
                        type="button"
                        onClick={() => selectRecipe(recipe)}
                        className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition hover:bg-white"
                      >
                        <strong className="block truncate text-sm">{recipe.name}</strong>
                        <span className="text-xs text-[#607064]">
                          {recipe.method} · {formatTime(recipe.totalTime)} ·{" "}
                          {recipe.water}g
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomRecipe(recipe.id)}
                        aria-label={`${recipe.name} 삭제`}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#d7ded4] text-[#607064] transition hover:border-[#c95b3d] hover:text-[#c95b3d]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </section>

        <aside className="order-1 min-w-0 space-y-4 lg:sticky lg:top-6 lg:order-2 lg:self-start">
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
                  onClick={jumpToPreviousStep}
                  aria-label="이전 단계"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-white/18 text-white transition hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
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

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAlertsEnabled((current) => !current)}
                className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition ${
                  alertsEnabled
                    ? "border-[#2f6f5f] bg-[#eef5ef] text-[#2f6f5f]"
                    : "border-[#d7ded4] bg-white text-[#607064]"
                }`}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                스마트 알림 {alertsEnabled ? "켜짐" : "꺼짐"}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(selectedRecipe.id)}
                className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition ${
                  selectedIsFavorite
                    ? "border-[#c95b3d] bg-[#fff0eb] text-[#c95b3d]"
                    : "border-[#d7ded4] bg-white text-[#607064]"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${selectedIsFavorite ? "fill-[#c95b3d]" : ""}`}
                  aria-hidden="true"
                />
                즐겨찾기
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#607064]">
              스마트 알림은 단계 전환과 완료 시 소리를 재생하고, 지원 기기에서는
              진동으로도 안내합니다.
            </p>

            <div
              className={`mt-5 grid gap-3 ${
                selectedRecipe.brewWater ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
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
              {selectedRecipe.brewWater &&
              selectedRecipe.bypassWater !== undefined &&
              selectedRecipe.finalWater !== undefined ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                    <span className="text-sm text-[#607064]">추출수</span>
                    <strong className="mt-2 block text-lg">
                      {formatWaterAmount(selectedRecipe.brewWater, scaleFactor)}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                    <span className="text-sm text-[#607064]">후가수</span>
                    <strong className="mt-2 block text-lg">
                      {formatWaterAmount(selectedRecipe.bypassWater, scaleFactor)}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                    <span className="text-sm text-[#607064]">최종 물</span>
                    <strong className="mt-2 block text-lg">{scaledFinalWater}</strong>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-3">
                  <span className="text-sm text-[#607064]">총 물량</span>
                  <strong className="mt-2 block text-2xl">{scaledWater}g</strong>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-lg border border-[#d7ded4] bg-[#f8faf6] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm text-[#607064]">현재 물량</span>
                  <strong className="block text-3xl">{targetWater}</strong>
                </div>
                <div className="text-right">
                  <span className="text-sm text-[#607064]">이번 단계</span>
                  <strong className="block text-2xl">+{stepWater}</strong>
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
                  {selectedRecipe.name}
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
              {selectedRecipe.steps.map((step, index) => ({ step, index })).filter(
                ({ step }) => step.end > step.start,
              ).map(({ step, index }) => {
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
                      {formatWaterAmount(
                        step.displayTargetWater ?? step.targetWater,
                        scaleFactor,
                      )}
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
