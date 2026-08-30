import { useState } from "react";
import { RecipeCard } from "./RecipeCard";

export function MultiRecipeStack({ recipes = [], onSaveChange, onCookAnother }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!recipes || recipes.length === 0) return null;

  const activeRecipe = recipes[activeIndex] || recipes[0];

  const TECHNIQUE_ICONS = ["⚡", "🍲", "🔥", "🌿", "🥘"];

  return (
    <div className="space-y-6">
      {/* Top Deck Tab Switcher */}
      <div className="bg-[#FFFDF9] p-4 rounded-loro-lg border border-[#EDE3D3] shadow-loro flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E56960] animate-pulse" />
          <span className="text-xs font-typewriter font-bold text-[#334D66] uppercase tracking-wider">
            Top 3 Chef Variations • Stacked Deck
          </span>
        </div>

        {/* 3 Option Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {recipes.map((rec, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={rec.id || idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-3.5 py-2 rounded-loro text-xs font-bold font-typewriter transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-[#334D66] text-[#FBF0DF] shadow-loro scale-102"
                    : "bg-[#FBF0DF] text-[#636951] hover:bg-[#EDE3D3] border border-[#EDE3D3]"
                }`}
              >
                <span>{TECHNIQUE_ICONS[idx % TECHNIQUE_ICONS.length]}</span>
                <span>Option {idx + 1}: {rec.tags?.[0] || rec.title.split(" ").slice(0, 2).join(" ")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stacked Deck Visual Container */}
      <div className="relative">
        {/* Layer 2 Background Card Peek (Visual Depth) */}
        {recipes.length > 2 && (
          <div
            onClick={() => setActiveIndex((activeIndex + 2) % recipes.length)}
            className="absolute -bottom-4 inset-x-4 h-16 bg-[#EDE3D3]/70 rounded-loro-lg border border-[#EDE3D3] -z-20 transform scale-[0.96] shadow-sm cursor-pointer hover:bg-[#EDE3D3] transition-all flex items-end justify-center pb-1"
          >
            <span className="text-[10px] font-typewriter text-[#636951] font-bold">
              Click to view: {recipes[(activeIndex + 2) % recipes.length]?.title}
            </span>
          </div>
        )}

        {/* Layer 1 Background Card Peek (Visual Depth) */}
        {recipes.length > 1 && (
          <div
            onClick={() => setActiveIndex((activeIndex + 1) % recipes.length)}
            className="absolute -bottom-2 inset-x-2 h-14 bg-[#F5E8D4] rounded-loro-lg border border-[#EDE3D3] -z-10 transform scale-[0.98] shadow-sm cursor-pointer hover:bg-[#EDE3D3] transition-all flex items-end justify-center pb-1"
          >
            <span className="text-[10px] font-typewriter text-[#636951] font-bold">
              Click to view: {recipes[(activeIndex + 1) % recipes.length]?.title}
            </span>
          </div>
        )}

        {/* Active Front Card */}
        <div className="relative z-10">
          <RecipeCard
            key={activeRecipe.id || activeIndex}
            recipe={activeRecipe}
            onSaveChange={onSaveChange}
            onCookAnother={onCookAnother}
          />
        </div>
      </div>
    </div>
  );
}
