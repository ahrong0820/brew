import type { Recipe } from "@/lib/types/defaultRecipe";

export type RecipeCatalogFilter = {
  query: string;
  filter: string;
  favoriteIds: readonly string[];
};

export function filterRecipes(
  recipes: readonly Recipe[],
  { query, filter, favoriteIds }: RecipeCatalogFilter,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedFilter = filter.toLowerCase();

  return recipes.filter((recipe) => {
    const matchesFilter =
      filter === "전체" ||
      (filter === "즐겨찾기" && favoriteIds.includes(recipe.id)) ||
      recipe.tags.some((tag) => tag.toLowerCase() === normalizedFilter);
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
}
