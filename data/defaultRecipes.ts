import { anstarDefaultRecipe } from "./anstarDefaultRecipe.ts";
import { clever111 } from "./clever111.ts";
import { jisVer2Default } from "./jisVer2Default.ts";
import { recipe484 } from "./recipe484.ts";
import { tetsuDefault } from "./tetsuDefault.ts";
import type { Recipe } from "../lib/types/defaultRecipe.ts";

const tetsu46DefaultRecipe = {
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
} satisfies Recipe;

const yongLightDefaultRecipe = {
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
} satisfies Recipe;

const switchDevilDefaultRecipe = {
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
} satisfies Recipe;

const hoffmannCleverDefaultRecipe = {
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
} satisfies Recipe;

export const defaultRecipes = [
  tetsu46DefaultRecipe,
  tetsuDefault,
  anstarDefaultRecipe,
  jisVer2Default,
  recipe484,
  yongLightDefaultRecipe,
  switchDevilDefaultRecipe,
  hoffmannCleverDefaultRecipe,
  clever111,
] satisfies readonly Recipe[];
