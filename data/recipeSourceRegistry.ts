export type SourceCheck = "exact" | "partial" | "secondary" | "unknown";

export interface RecipeSourceRecord {
  recipeId: string;
  label: string;
  url?: string;
  check: SourceCheck;
}

export const recipeSourceRegistry: readonly RecipeSourceRecord[] = [
  { recipeId: "tetsu-46", label: "2016 World Brewers Cup 참고", check: "secondary" },
  { recipeId: "anstar-6888", label: "기존 전사본", check: "unknown" },
  {
    recipeId: "jis-4666",
    label: "정인성 바리스타 공개 영상 참고",
    url: "https://youtu.be/JWHanqQ5MsQ",
    check: "partial",
  },
  {
    recipeId: "jis-ver2-hot",
    label: "정인성 바리스타 공개 영상 참고",
    url: "https://youtu.be/JWHanqQ5MsQ",
    check: "partial",
  },
  { recipeId: "signature-cone", label: "기존 전사본", check: "unknown" },
  { recipeId: "deepblue-v60", label: "기존 전사본", check: "unknown" },
  {
    recipeId: "clever-official-distributor-185",
    label: "Clever Coffee Brewers 공식 유통 제품 페이지",
    url: "https://cleverbrewing.coffee/products/clever-dripper",
    check: "exact",
  },
  { recipeId: "clever-balanced-reference", label: "내부 참고 레시피", check: "unknown" },
] as const;

export function sourceRecordForRecipe(recipeId: string) {
  return recipeSourceRegistry.find((record) => record.recipeId === recipeId);
}
