export function getAdjacentRecipeId(
  recipeIds: readonly string[],
  recipeId: string,
  direction: -1 | 1,
) {
  const currentIndex = recipeIds.indexOf(recipeId);
  const targetIndex = currentIndex + direction;

  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= recipeIds.length
  ) {
    return null;
  }

  return recipeIds[targetIndex] ?? null;
}
