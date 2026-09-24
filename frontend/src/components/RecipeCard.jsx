import { useState } from "react";
import { toggleSaveRecipe, isRecipeSaved } from "../lib/savedRecipes";
import { scaleRecipeIngredients } from "../lib/parseRecipes";
import { CookingModeModal } from "./CookingModeModal";
import { SmartSwapModal } from "./SmartSwapModal";
import { SocialShareModal } from "./SocialShareModal";

export function RecipeCard({ recipe, onSaveChange, onCookAnother }) {
  const [copied, setCopied] = useState(false);
  const [portionCount, setPortionCount] = useState(2);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});
  const [showCookingMode, setShowCookingMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [customIngredients, setCustomIngredients] = useState(null);

  if (!recipe) return null;

  const isSaved = isRecipeSaved(recipe.id, recipe.title);
  const baseIngredients = customIngredients || recipe.ingredients || [];
  const scaledIngredients = scaleRecipeIngredients(baseIngredients, portionCount, recipe.basePortions || 2);

  function handleToggleSave() {
    const res = toggleSaveRecipe({ ...recipe, ingredients: baseIngredients });
    if (onSaveChange) onSaveChange(res.isSaved);
  }

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    const text = `🍽️ ${recipe.title}
Portions: ${portionCount} servings | Prep Time: ${recipe.prepTime} | Calories: ${recipe.calories || "~480 kcal"}

INGREDIENTS:
${scaledIngredients.map((i) => `• ${i}`).join("\n")}

INSTRUCTIONS:
${recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}

PAIRINGS:
• Craft Drink: ${recipe.pairing || "Charred Citrus Highball"}
• Quick Side: ${recipe.quickSide || "Whipped Garlic Butter with warm bread"}

CHEF'S NOTE:
${recipe.chefNote}

— Crafted with Fridge2Feast (Artisanal AI Smokehouse)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleIngredient(idx) {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function toggleStep(idx) {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function applyIngredientSwap(newSub) {
    if (swapTarget === null) return;
    const updated = [...baseIngredients];
    updated[swapTarget] = `${newSub} (Swapped)`;
    setCustomIngredients(updated);
    setSwapTarget(null);
  }

  return (
    <article className="recipe-card paper-card print-card rounded-loro-lg border border-[#E3CFB1] shadow-loro-lg overflow-hidden transition-all relative">
      {/* Top Banner Ribbon */}
      <div className="recipe-ribbon bg-[#201B17] text-[#F5E6CC] px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F2382F] animate-pulse" />
          <span className="text-xs font-typewriter tracking-widest uppercase font-bold text-[#F5E6CC]">
            03 / Mise recipe
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-typewriter text-[#F3C694]">
          <span>Prep {recipe.prepTime || "15m"}</span>
          <span>•</span>
          <span>Cook {recipe.cookTime || "15m"}</span>
          <span>•</span>
          <span>{recipe.calories || "~480 kcal"}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-10 space-y-8">
        {/* Title Header & Portion Scaler Bar */}
        <div className="border-b border-[#E3CFB1] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {recipe.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs font-typewriter font-bold bg-[#F5E6CC] text-[#6D5545] border border-[#E3CFB1] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Dynamic Portion Scaler Control */}
            <div className="portion-control no-print flex items-center gap-2 bg-[#F5E6CC] px-3 py-1.5 rounded-lg border border-[#E3CFB1]">
              <span className="text-xs font-typewriter font-bold text-[#201B17] uppercase">
                Portions
              </span>
              {[1, 2, 4, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPortionCount(num)}
                  aria-pressed={portionCount === num}
                  className={`w-7 h-7 rounded text-xs font-typewriter font-bold transition-all ${
                    portionCount === num
                      ? "bg-[#F2382F] text-white shadow-sm"
                      : "text-[#201B17] hover:bg-[#E3CFB1]"
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#201B17] tracking-tight leading-tight">
            {recipe.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <p className="text-sm font-typewriter text-[#6D5545]">
              Scratch-cooked with 3 pantry items • Scaled for {portionCount} {portionCount === 1 ? "portion" : "portions"}
            </p>

            {/* Launch Hands-Free Cooking Mode Button */}
            <button
              type="button"
              onClick={() => setShowCookingMode(true)}
              className="no-print px-4 py-2 rounded-loro bg-[#201B17] hover:bg-[#100E0C] text-[#F5E6CC] text-xs font-typewriter font-bold uppercase tracking-wider shadow-loro flex items-center gap-2 transition-all hover:scale-102"
            >
              <span>Open cooking mode</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Two-Column Recipe Layout */}
        <div className="recipe-layout grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Ingredients Column (5 cols) */}
          <div className="ingredients-panel lg:col-span-5 bg-[#F5E6CC]/60 p-6 rounded-loro border border-[#E3CFB1] h-fit space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3CFB1]">
              <h3 className="font-display text-xl text-[#201B17] flex items-center gap-2">
                Ingredients
              </h3>
              <span className="text-[11px] font-typewriter text-[#6D5545]">
                ({portionCount}x scaled)
              </span>
            </div>

            <ul className="space-y-2.5">
              {scaledIngredients.map((item, idx) => {
                const isChecked = checkedIngredients[idx];
                return (
                  <li
                    key={idx}
                    className={`flex items-start justify-between gap-2 p-2 rounded-md transition-all ${
                      isChecked
                        ? "bg-[#E3CFB1]/50 text-[#9C806D] line-through"
                        : "hover:bg-white text-[#201B17]"
                    }`}
                  >
                    <div
                      onClick={() => toggleIngredient(idx)}
                      className="flex items-start gap-2.5 flex-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(isChecked)}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-[#E3CFB1] text-[#F2382F] focus:ring-[#F2382F] cursor-pointer"
                      />
                      <span className="text-sm font-medium leading-relaxed">{item}</span>
                    </div>

                    {/* Smart Swap button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSwapTarget(idx);
                      }}
                      title="Swap this ingredient"
                      className="no-print text-[10px] font-typewriter text-[#6D5545] hover:text-[#F2382F] px-1.5 py-0.5 rounded border border-[#E3CFB1] hover:border-[#F2382F] bg-white transition-all flex-shrink-0"
                    >
                      Swap
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions Column (7 cols) */}
          <div className="method-panel lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E3CFB1]">
                <h3 className="font-display text-xl text-[#201B17] flex items-center gap-2">
                  Method
                </h3>
                <span className="text-[11px] font-typewriter text-[#6D5545]">
                  Click step to check off
                </span>
              </div>

              <ol className="space-y-4">
                {recipe.instructions.map((step, idx) => {
                  const isDone = completedSteps[idx];
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`p-4 rounded-loro border transition-all cursor-pointer ${
                        isDone
                          ? "bg-[#6D5545]/10 border-[#6D5545]/30 opacity-75"
                          : "bg-white border-[#E3CFB1] hover:border-[#F2382F] shadow-loro-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold font-typewriter transition-all ${
                            isDone
                              ? "bg-[#6D5545] text-white"
                              : "bg-[#201B17] text-[#F5E6CC]"
                          }`}
                        >
                          {isDone ? "✓" : idx + 1}
                        </span>
                        <div className="space-y-1 flex-1">
                          <p className={`text-sm leading-relaxed ${isDone ? "line-through text-[#6D5545]" : "text-[#201B17]"}`}>
                            {step}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Smokehouse Beverage & Side Pairing Section */}
            {(recipe.pairing || recipe.quickSide) && (
              <div className="pairing-panel grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F5E6CC]/70 p-4 rounded-loro border border-[#E3CFB1]">
                {recipe.pairing && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-typewriter font-bold uppercase tracking-wider text-[#F2382F] flex items-center gap-1">
                      Beverage pairing
                    </span>
                    <p className="text-xs text-[#201B17] font-medium leading-relaxed">
                      {recipe.pairing}
                    </p>
                  </div>
                )}

                {recipe.quickSide && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-typewriter font-bold uppercase tracking-wider text-[#6D5545] flex items-center gap-1">
                      Companion side
                    </span>
                    <p className="text-xs text-[#201B17] font-medium leading-relaxed">
                      {recipe.quickSide}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Chef's Tasting Note */}
            {recipe.chefNote && (
              <div className="chef-note bg-[#FFF0E4] border-l-4 border-[#F2382F] p-4 sm:p-5 rounded-r-loro">
                <div className="flex items-center gap-2 mb-1 text-xs font-typewriter font-bold uppercase tracking-wider text-[#F2382F]">
                  Chef's note
                </div>
                <p className="text-sm text-[#201B17] italic font-serif leading-relaxed">
                  "{recipe.chefNote}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Toolbar */}
        <div className="recipe-toolbar no-print pt-6 border-t border-[#E3CFB1] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Save / Bookmark button */}
            <button
              type="button"
              onClick={handleToggleSave}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold font-typewriter uppercase tracking-wider transition-all flex items-center gap-2 ${
                isSaved
                  ? "bg-[#6D5545] text-white hover:bg-[#513E32]"
                  : "bg-[#201B17] text-[#F5E6CC] hover:bg-[#100E0C] shadow-sm"
              }`}
            >
              <span>{isSaved ? "Saved in cookbook" : "Save recipe"}</span>
            </button>

            {/* Export Card button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2.5 rounded-lg text-xs font-bold font-typewriter uppercase tracking-wider bg-white border border-[#E3CFB1] text-[#201B17] hover:bg-[#F5E6CC] transition-all flex items-center gap-1.5"
            >
              <span>Export card</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-lg text-xs font-bold font-typewriter uppercase tracking-wider bg-white border border-[#E3CFB1] text-[#201B17] hover:bg-[#F5E6CC] transition-all flex items-center gap-1.5"
            >
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-lg text-xs font-bold font-typewriter uppercase tracking-wider bg-white border border-[#E3CFB1] text-[#201B17] hover:bg-[#F5E6CC] transition-all flex items-center gap-1.5"
            >
              <span>Print</span>
            </button>
          </div>

          {onCookAnother && (
            <button
              type="button"
              onClick={onCookAnother}
              className="px-5 py-2.5 rounded-lg text-xs font-bold font-typewriter uppercase tracking-wider bg-[#F2382F] hover:bg-[#CF2A23] text-white shadow-loro-coral transition-all hover:scale-102"
            >
              Create another recipe →
            </button>
          )}
        </div>
      </div>

      {/* Cooking Mode Modal */}
      {showCookingMode && (
        <CookingModeModal
          recipe={{ ...recipe, ingredients: scaledIngredients }}
          onClose={() => setShowCookingMode(false)}
        />
      )}

      {/* Smart Swap Modal */}
      {swapTarget !== null && (
        <SmartSwapModal
          ingredient={baseIngredients[swapTarget]}
          onSelectSwap={applyIngredientSwap}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {/* Social Share / Postcard Exporter Modal */}
      {showShareModal && (
        <SocialShareModal
          recipe={{ ...recipe, ingredients: scaledIngredients }}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </article>
  );
}
