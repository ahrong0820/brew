"use client";

import {
  Droplets,
  Heart,
  Scale,
  Search,
  Thermometer,
} from "lucide-react";
import { recipeTemperaturePresentation } from "@/lib/recipes/recipeTemperature";
import {
  formatRecipeTime,
  formatRecipeWaterAmount,
} from "@/lib/recipes/recipePresentation";
import type { Recipe } from "@/lib/types/defaultRecipe";

export const recipeFilterOptions = [
  "전체",
  "즐겨찾기",
  "나만의 레시피",
  "V60",
  "클레버",
  "스위치",
  "라이트",
  "단맛",
] as const;

type RecipeCatalogProps = {
  query: string;
  filter: string;
  recipes: readonly Recipe[];
  selectedRecipeId: string;
  favoriteIds: readonly string[];
  storageNotice: string | null;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
};

export default function RecipeCatalog({
  query,
  filter,
  recipes,
  selectedRecipeId,
  favoriteIds,
  storageNotice,
  onQueryChange,
  onFilterChange,
  onSelectRecipe,
}: RecipeCatalogProps) {
  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-[#d7ded4] bg-white p-3 shadow-sm shadow-black/5">
        <label className="relative flex min-w-0 flex-1 items-center">
          <Search
            className="absolute left-3 h-4 w-4 text-[#607064]"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="레시피 검색"
            placeholder="원두, 도구, 향미 검색"
            className="h-11 w-full rounded-md border border-[#d7ded4] bg-[#f8faf6] py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[#2f6f5f] focus:bg-white focus:ring-2 focus:ring-[#2f6f5f]/20"
          />
        </label>

        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-md bg-[#edf1ea] p-1">
          {recipeFilterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
              aria-pressed={filter === option}
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

      {storageNotice ? (
        <p
          role="alert"
          className="rounded-lg border border-[#dca18f] bg-[#fff0eb] px-4 py-3 text-sm text-[#8b3e2f]"
        >
          {storageNotice}
        </p>
      ) : null}

      <div data-recipe-list="true" className="grid gap-4 md:grid-cols-2">
        {recipes.map((recipe) => {
          const selected = recipe.id === selectedRecipeId;
          const favorite = favoriteIds.includes(recipe.id);

          return (
            <button
              key={recipe.id}
              type="button"
              data-recipe-row="true"
              data-recipe-id={recipe.id}
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelectRecipe(recipe)}
              aria-pressed={selected}
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
                    {formatRecipeTime(recipe.totalTime)}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#526055]">
                {recipe.profile}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md bg-[#f4f6f1] p-3">
                  <Scale
                    className="mb-2 h-4 w-4 text-[#2f6f5f]"
                    aria-hidden="true"
                  />
                  <span className="block text-[#607064]">원두</span>
                  <strong>{recipe.dose}g</strong>
                </div>
                <div className="rounded-md bg-[#f4f6f1] p-3">
                  <Droplets
                    className="mb-2 h-4 w-4 text-[#2f6f5f]"
                    aria-hidden="true"
                  />
                  <span className="block text-[#607064]">물</span>
                  <strong>
                    {formatRecipeWaterAmount(recipe.finalWater ?? recipe.water)}
                  </strong>
                </div>
                <div className="rounded-md bg-[#f4f6f1] p-3">
                  <Thermometer
                    className="mb-2 h-4 w-4 text-[#2f6f5f]"
                    aria-hidden="true"
                  />
                  <span className="block text-[#607064]">온도</span>
                  <strong>{recipeTemperaturePresentation(recipe).display}</strong>
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

      {recipes.length === 0 ? (
        <p
          role="status"
          className="rounded-lg border border-dashed border-[#bfc9bd] bg-white px-5 py-8 text-center text-sm text-[#607064]"
        >
          검색 조건에 맞는 레시피가 없습니다.
        </p>
      ) : null}
    </>
  );
}
