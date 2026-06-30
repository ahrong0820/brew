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
  {
    recipeId: "tetsu-46",
    label: "테츠 카스야 공식 YouTube 4:6 메서드 해설",
    url: "https://www.youtube.com/watch?v=lJNPp-onikk",
    check: "partial",
  },
  {
    recipeId: "anstar-multiserve-20g-2024",
    label: "안스타 공식 YouTube 2·4인분 레시피(통칭 6888)와 제작자 고정 댓글",
    url: "https://www.youtube.com/watch?v=uZs78TPm7ws",
    check: "partial",
  },
  {
    recipeId: "tetsu-neo-2026",
    label: "테츠 카스야 공식 YouTube THE NEO BREW 2026 설명",
    url: "https://www.youtube.com/watch?v=k0nsShguOsU",
    check: "partial",
  },
  {
    recipeId: "jis-ver2-hot",
    label: "정인성의 커피생활 공식 YouTube 국룰 Ver 2.0 설명",
    url: "https://www.youtube.com/watch?v=i7Q-pvahrXw",
    check: "partial",
  },
  {
    recipeId: "jis-484-15g-2026",
    label: "정인성의 커피생활 공식 YouTube 15g 484 업데이트 설명",
    url: "https://www.youtube.com/watch?v=Q3CbFCF5CD4",
    check: "partial",
  },
  {
    recipeId: "clever-official-distributor-185",
    label: "Clever Coffee Brewers 공식 유통 제품 페이지",
    url: cleverOfficialRecipeUrl,
    check: "exact",
  },
  {
    recipeId: "jis-clever-1-11",
    label: "정인성의 커피생활 공식 YouTube 최신 Clever 설명",
    url: "https://www.youtube.com/watch?v=JWHanqQ5MsQ",
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
