import { Gauge, Thermometer } from "lucide-react";
import type { BaristaRecipeMatch } from "@/lib/types/baristaRecipe";

interface RecommendationCandidatesProps {
  matches: readonly BaristaRecipeMatch[];
  selectedRecipeId: string | null;
  onSelect: (recipeId: string) => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function rankLabel(index: number) {
  return index === 0 ? "1순위 추천" : `${index + 1}순위 대안`;
}

export default function RecommendationCandidates({
  matches,
  selectedRecipeId,
  onSelect,
}: RecommendationCandidatesProps) {
  if (matches.length === 0) return null;

  return (
    <section
      aria-labelledby="recommendation-candidates-title"
      className="rounded-xl border border-[#d7ded4] bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#8a623d]">Barista recipe match</p>
          <h3 id="recommendation-candidates-title" className="mt-1 text-base font-bold">
            추천 레시피 후보
          </h3>
        </div>
        <p className="text-xs leading-5 text-[#687168]">
          1순위를 그대로 사용하거나 다른 레시피를 선택할 수 있습니다.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {matches.map((match, index) => {
          const selected = match.recipe.id === selectedRecipeId;
          const recipe = match.recipe;

          return (
            <button
              key={recipe.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(recipe.id)}
              className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2 ${
                selected
                  ? "border-[#2f6f5f] bg-[#eef5ef] shadow-sm"
                  : "border-[#d7ded4] bg-[#fbfcfa] hover:border-[#8fa99d] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                    selected
                      ? "bg-[#2f6f5f] text-white"
                      : "bg-[#edf1ea] text-[#58645a]"
                  }`}
                >
                  {rankLabel(index)}
                </span>
                <span className="text-xs font-semibold text-[#687168]">
                  적합도 {match.score}
                </span>
              </div>

              <h4 className="mt-3 text-sm font-bold leading-5 text-[#26312b]">
                {recipe.name}
              </h4>
              <p className="mt-1 text-xs text-[#687168]">{recipe.author}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <span className="rounded-md bg-white px-2 py-1.5 font-semibold text-[#4f5d54]">
                  1:{recipe.ratio}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1.5 font-semibold text-[#4f5d54]">
                  <Thermometer aria-hidden="true" size={12} />
                  {recipe.temperatureCelsius ?? "가변"}℃
                </span>
                <span className="col-span-2 flex items-center gap-1 rounded-md bg-white px-2 py-1.5 font-semibold text-[#4f5d54]">
                  <Gauge aria-hidden="true" size={12} />
                  {formatTime(recipe.targetTimeMinSeconds)}~
                  {formatTime(recipe.targetTimeMaxSeconds)} · {recipe.grindIntent.originalDescription}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-xs leading-5 text-[#607064]">
                {match.reasons.slice(0, 2).map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>

              <p className="mt-3 text-xs font-bold text-[#2f6f5f]">
                {selected ? "현재 선택됨" : "이 레시피 선택"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
