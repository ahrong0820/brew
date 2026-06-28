export type SourceCheck = "exact" | "partial" | "secondary" | "unknown";

export interface RecipeSourceRecord {
  recipeId: string;
  label: string;
  check: SourceCheck;
}

export const recipeSourceRegistry: readonly RecipeSourceRecord[] = [
  { recipeId: "tetsu-46", label: "2016 World Brewers Cup 참고", check: "secondary" },
  { recipeId: "anstar-6888", label: "기존 전사본", check: "unknown" },
  { recipeId: "jis-4666", label: "제작자 공개 영상 참고", check: "partial" },
  { recipeId: "jis-ver2-hot", label: "제작자 공개 영상 참고", check: "partial" },
  { recipeId: "signature-cone", label: "기존 전사본", check: "unknown" },
  { recipeId: "deepblue-v60", label: "기존 전사본", check: "unknown" },
] as const;

export function sourceRecordForRecipe(recipeId: string) {
  return recipeSourceRegistry.find((record) => record.recipeId === recipeId);
}
