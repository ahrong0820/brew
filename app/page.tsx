"use client";

import { Coffee } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import BrewTimerPanel from "./BrewTimerPanel";
import CustomRecipeEditor from "./CustomRecipeEditor";
import RecipeCatalog from "./RecipeCatalog";
import { useBrewTimer } from "./hooks/useBrewTimer";
import { useRecipeLibraryStorage } from "./hooks/useRecipeLibraryStorage";
import { defaultRecipes } from "@/data/defaultRecipes";
import { filterRecipes } from "@/lib/recipes/filterRecipes";
import { formatRecipeTime } from "@/lib/recipes/recipePresentation";
import { recipeTemperaturePresentation } from "@/lib/recipes/recipeTemperature";
import { useRecipeOrder } from "@/lib/recipes/useRecipeOrder";
import type { Recipe } from "@/lib/types/defaultRecipe";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const heroImageSrc = `${basePath}/brewing-hero.png`;
const recipes: readonly Recipe[] = defaultRecipes;

export default function Home() {
  const [recommendedRecipe, setRecommendedRecipe] = useState<Recipe | null>(null);
  const [selectedId, setSelectedId] = useState(recipes[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const {
    customRecipes,
    favoriteIds,
    storageLoaded,
    storageNotice,
    setCustomRecipes,
    toggleFavorite,
    removeFavorite,
  } = useRecipeLibraryStorage();

  const allRecipes = useMemo(
    () => [
      ...(recommendedRecipe ? [recommendedRecipe] : []),
      ...customRecipes,
      ...recipes,
    ],
    [customRecipes, recommendedRecipe],
  );
  const { orderedRecipes } = useRecipeOrder(allRecipes, {
    ready: storageLoaded,
  });
  const selectedRecipe =
    orderedRecipes.find((recipe) => recipe.id === selectedId) ?? recipes[0];

  const handleRecipeChange = useCallback((recipe: Recipe) => {
    if (recipe.id.startsWith("recommendation-")) {
      setRecommendedRecipe(recipe);
    }
    setSelectedId(recipe.id);
  }, []);

  const timer = useBrewTimer({
    selectedRecipe,
    onRecipeChange: handleRecipeChange,
  });

  const filteredRecipes = useMemo(
    () =>
      filterRecipes(orderedRecipes, {
        query,
        filter,
        favoriteIds,
      }),
    [favoriteIds, filter, orderedRecipes, query],
  );
  const selectedIsFavorite = favoriteIds.includes(selectedRecipe.id);

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
                    {formatRecipeTime(timer.totalTime)}
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
                <strong className="font-mono text-xl">
                  {formatRecipeTime(timer.remaining)}
                </strong>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#d9ded6]">
              <div
                className="h-full rounded-full bg-[#2f6f5f]"
                style={{ width: `${timer.progress}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-[#607064]">원두</span>
                <strong className="block text-lg">{timer.dose}g</strong>
              </div>
              <div>
                <span className="text-[#607064]">
                  {selectedRecipe.finalWater ? "최종 물" : "물"}
                </span>
                <strong className="block text-lg">{timer.scaledFinalWater}</strong>
              </div>
              <div>
                <span className="text-[#607064]">온도</span>
                <strong className="block text-lg">
                  {recipeTemperaturePresentation(selectedRecipe).display}
                </strong>
              </div>
            </div>
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:px-8">
        <section
          data-main-content="true"
          className="order-2 min-w-0 space-y-5 lg:order-1"
        >
          <RecipeCatalog
            query={query}
            filter={filter}
            recipes={filteredRecipes}
            selectedRecipeId={selectedRecipe.id}
            favoriteIds={favoriteIds}
            storageNotice={storageNotice}
            onQueryChange={setQuery}
            onFilterChange={setFilter}
            onSelectRecipe={timer.selectRecipe}
          />

          <CustomRecipeEditor
            customRecipes={customRecipes}
            setCustomRecipes={setCustomRecipes}
            selectedRecipeId={selectedRecipe.id}
            defaultRecipe={recipes[0]}
            onSelectRecipe={timer.selectRecipe}
            onRemoveFavorite={removeFavorite}
            onFilterChange={setFilter}
            onBlocked={timer.blockWithNotice}
          />
        </section>

        <BrewTimerPanel
          selectedRecipe={selectedRecipe}
          timer={timer}
          selectedIsFavorite={selectedIsFavorite}
          onToggleFavorite={() => toggleFavorite(selectedRecipe.id)}
        />
      </div>
    </main>
  );
}
