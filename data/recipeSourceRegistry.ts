export type SourceCheck =
  | "exact"
  | "partial"
  | "reference"
  | "secondary"
  | "unknown";

export interface RecipeSourceRecord {
  recipeId: string;
  label: string;
  url?: string;
  check: SourceCheck;
}

const cleverOfficialRecipeUrl = [
  "https://cleverbrewing.coffee",
  "/products/clever-dripper",
].join("");

export const recipeSourceRegistry: readonly RecipeSourceRecord[] = [
  { recipeId: "tetsu-46", label: "2016 World Brewers Cup 참고", check: "secondary" },
  { recipeId: "anstar-6888", label: "기존 전사본", check: "unknown" },
  {
    recipeId: "jis-4666",
    label: "기존 V60 전사본 — Clever 영상과 분리",
    check: "reference",
  },
  {
    recipeId: "jis-ver2-hot",
    label: "기존 V60 전사본 — Clever 영상과 분리",
    check: "reference",
  },
  { recipeId: "signature-cone", label: "기존 전사본", check: "unknown" },
  { recipeId: "deepblue-v60", label: "기존 전사본", check: "unknown" },
  {
    recipeId: "clever-official-distributor-185",
    label: "Clever Coffee Brewers 공식 유통 제품 페이지",
    url: cleverOfficialRecipeUrl,
    check: "exact",
  },
  {
    recipeId: "jis-clever-1-11",
    label: "정인성의 커피생활 공식 YouTube 영상 설명",
    url: "https://youtu.be/JWHanqQ5MsQ",
    check: "partial",
  },
  {
    recipeId: "clever-balanced-reference",
    label: "내부 참고 레시피",
    check: "reference",
  },
] as const;

export function sourceRecordForRecipe(recipeId: string) {
  return recipeSourceRegistry.find((record) => record.recipeId === recipeId);
}
