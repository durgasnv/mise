import { getPantry } from '../lib/pantryInventory.js';
import { accountKey } from '../lib/accountStore.js';
import { reviewPantry } from '../../../shared/pantry.js';
import { NutritionPanel } from "./NutritionPanel.jsx";
import { findCookingSession, createCookingSession, updateCookingSession } from "../lib/cookingProgress.js";
import { RecipeEditor } from "./RecipeEditor.jsx";
import { PantryDeduction } from "./PantryDeduction.jsx";
import { recipeText } from "../../../shared/recipe-export.js";
import { recordMealEvent } from "../lib/mealActivity.js";
import { cookbookOwner } from "../lib/savedRecipes.js";
import { useState, useEffect } from "react";
import { toggleSaveRecipe, isRecipeSaved, saveRecipe } from "../lib/savedRecipes";
import { scaledRecipeView } from "../../../shared/recipe-scaling.js";
import { CookingModeModal } from "./CookingModeModal";
import { SmartSwapModal } from "./SmartSwapModal";
import { SocialShareModal } from "./SocialShareModal";

export function RecipeCard({ recipe: providedRecipe, onSaveChange, onCookAnother }) {
  const [activityOwner] = useState(cookbookOwner);
  const [,setPantryVersion] = useState(0);
  useEffect(() => { const refresh = () => { setPantryVersion(n => n + 1); setReviewConfirmed(false); }; window.addEventListener("mise-pantry_v1-change",refresh); window.addEventListener("storage",refresh); return () => { window.removeEventListener("mise-pantry_v1-change",refresh); window.removeEventListener("storage",refresh); }; },[]);
  const [restored] = useState(() => { try { return providedRecipe ? findCookingSession(providedRecipe) : null; } catch { return null; } });
  const [mealSession, setMealSession] = useState(restored?.sessionId || null);
  const [mealFinished, setMealFinished] = useState(false);
  const [mealRating, setMealRating] = useState('');
  const [shopping, setShopping] = useState('');
  const [activityMessage, setActivityMessage] = useState('');
  function record(type, data) {
    try { return recordMealEvent(type, { ...data, owner: activityOwner }); }
    catch { setActivityMessage('Meal activity could not be saved on this device.'); return false; }
  }
  function startCooking() {
    let session;
    try {
      session = createCookingSession(recipe, activityOwner);
      const isResume = session.phase === 'cooking';
      updateCookingSession(session.sessionId, { phase: 'cooking' }, activityOwner);
      if (!isResume) record('cookingStarted', { sessionId: session.sessionId, recipeId: recipe.id });
    } catch { setActivityMessage('Cooking progress could not be saved on this device.'); session = { sessionId: `temporary-${Date.now()}` }; record('cookingStarted', { sessionId: session.sessionId, recipeId: recipe.id }); }
    setMealSession(session.sessionId); setMealFinished(false); setMealRating(''); setShopping(''); setShowCookingMode(true);
  }
  function completeMeal() {
    if (record('mealCompleted', { sessionId: mealSession, recipeId: (adaptedRecipe || providedRecipe).id })) setMealFinished(true); else setActivityMessage('Your meal could not be recorded on this device.');
  }
  const [nutrition, setNutrition] = useState(providedRecipe?.nutrition);
  const [showEditor, setShowEditor] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(restored?.reviewConfirmed || false);
  const [copied, setCopied] = useState(false);
  const [portionCount, setPortionCount] = useState(providedRecipe?.basePortions || 2);
  const [checkedIngredients, setCheckedIngredients] = useState(restored?.checkedIngredients || {});
  const [completedSteps, setCompletedSteps] = useState(restored?.completedSteps || {});
  const [showCookingMode, setShowCookingMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [adaptedRecipe, setAdaptedRecipe] = useState(null);

  useEffect(() => { if (providedRecipe?.resumeCooking && restored?.phase === 'cooking') setShowCookingMode(true); }, []);
  if (!providedRecipe) return null;
  const baseRecipe = { ...(adaptedRecipe || providedRecipe), nutrition };
  const recipe = scaledRecipeView(baseRecipe, portionCount);
  let pantryError = '';
  if (recipe.structured && baseRecipe.constraints && localStorage.getItem(accountKey('pantry_v1',activityOwner)) !== null) {
    try {
      const stock = getPantry(activityOwner);
      recipe.review = { ...recipe.review, ...reviewPantry(recipe.structured,{ ...baseRecipe.constraints, servings:portionCount, strictPantry:false,
        pantry:stock.items.filter(i => i.quantity !== 0).map(({name,quantity,unit}) => ({name,quantity,unit})),staples:stock.staples }) };
    } catch { pantryError = 'Current pantry data could not be checked. Open Manage pantry to review the preserved data before starting a new meal.'; }
  }

  const isSaved = isRecipeSaved(recipe.id, recipe.title);
  const scaledIngredients = recipe.ingredients || [];

  function handleToggleSave() {
    try {
      const res = toggleSaveRecipe(baseRecipe); setSaveError('');
      if (res.isSaved) record('saved', { recipeId: baseRecipe.id });
      if (onSaveChange) onSaveChange(res.isSaved);
    } catch { setSaveError('Your recipe could not be saved on this device. Free browser storage or open the cookbook to review its data.'); }
  }

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    const text = recipeText(recipe);

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function checkpoint(patch) {
    try { const s = createCookingSession(recipe, activityOwner); updateCookingSession(s.sessionId, patch, activityOwner); }
    catch { setActivityMessage('Checklist progress could not be saved on this device.'); }
  }
  function toggleIngredient(idx) {
    const next = { ...checkedIngredients, [idx]: !checkedIngredients[idx] }; setCheckedIngredients(next); checkpoint({ checkedIngredients: next });
  }

  function toggleStep(idx) {
    const next = { ...completedSteps, [idx]: !completedSteps[idx] }; setCompletedSteps(next); checkpoint({ completedSteps: next });
  }

  function applyIngredientSwap(adapted) {
    setNutrition(undefined);
    setAdaptedRecipe(adapted); setMealFinished(false); setMealSession(null); setActivityMessage('');
    setPortionCount(adapted.basePortions);
    setCheckedIngredients({}); setCompletedSteps({}); setReviewConfirmed(false);
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
          <span>Prep {recipe.prepTime || "Not provided"}</span>
          <span>•</span>
          <span>Cook {recipe.cookTime || "Not provided"}</span>
          <span>•</span>
          <span>{recipe.nutrition ? "USDA ingredient estimates" : "Nutrition not calculated"}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-10 space-y-8">
        {pantryError && <p role="alert">{pantryError}</p>}
        {recipe.review && <section aria-label="Pantry review" className="bg-[#FFF8EC] border p-4 space-y-2">
          {recipe.review.missing?.length > 0 && <p className="font-semibold">Missing or insufficient ingredients</p>}
          {[...(recipe.review.missing || []), ...(recipe.review.quantityChecks || []), ...(recipe.review.labelChecks || [])].map((note, i) => <p className="text-sm" key={i}>{note}</p>)}
          {[...(recipe.review.missing || []), ...(recipe.review.quantityChecks || []), ...(recipe.review.labelChecks || [])].length > 0 && <label className="block text-sm"><input type="checkbox" checked={reviewConfirmed} onChange={e => { setReviewConfirmed(e.target.checked); checkpoint({ reviewConfirmed: e.target.checked }); }} /> I checked quantities, obtained missing items, and verified ingredient labels for my restrictions.</label>}
          {recipe.review.safetyNotes?.map((note, i) => <p key={`safety-${i}`} className="text-sm font-semibold">{note}</p>)}
          <p className="text-sm">Equipment: {recipe.structured?.equipment.join(', ')}</p>
        </section>}
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
                  disabled={!baseRecipe.structured}
                  onClick={() => { setPortionCount(num); setReviewConfirmed(false); setCheckedIngredients({}); setCompletedSteps({}); }}
                  aria-pressed={portionCount === num}
                  className={`w-7 h-7 rounded text-xs font-typewriter font-bold transition-all ${
                    portionCount === num
                      ? "bg-[#F2382F] text-white shadow-sm"
                      : "text-[#201B17] hover:bg-[#E3CFB1]"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#201B17] tracking-tight leading-tight">
            {recipe.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <p className="text-sm font-typewriter text-[#6D5545]">
              {!baseRecipe.structured ? 'Legacy recipe • Scaling unavailable • ' : ''}Prepared for {portionCount} {portionCount === 1 ? "portion" : "portions"}
            </p>

            {/* Launch Hands-Free Cooking Mode Button */}
            <button
              type="button"
              disabled={Boolean(pantryError || recipe.review && [...(recipe.review.missing || []), ...(recipe.review.quantityChecks || []), ...(recipe.review.labelChecks || [])].length && !reviewConfirmed)}
              onClick={startCooking}
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
                ({portionCount} servings)
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
                      onClick={e => { if (e.target.tagName !== "INPUT") toggleIngredient(idx); }}
                      className="flex items-start gap-2.5 flex-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(isChecked)}
                        aria-label={`Check ${item}`}
                        onChange={() => toggleIngredient(idx)}
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
                      disabled={!baseRecipe.structured}
                      title={baseRecipe.structured ? "Adapt this recipe with a replacement" : "Regenerate this legacy recipe to enable swaps"}
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
                      role="button" tabIndex={0} aria-label={`Mark step ${idx + 1} ${isDone ? "unfinished" : "complete"}`}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleStep(idx); } }}
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

        {mealFinished && <section className="border p-4 space-y-3" aria-label="Meal feedback">
          <h3 className="font-semibold">Meal recorded. How did it go?</h3>
          <PantryDeduction key={mealSession} recipe={recipe} sessionId={mealSession} owner={activityOwner} />
          <label className="block">Rating <select className="border p-2" value={mealRating} onChange={e => setMealRating(e.target.value)}><option value="">Choose (optional)</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} / 5</option>)}</select></label>
          <label className="block">Needed extra ingredients? <select className="border p-2" value={shopping} onChange={e => setShopping(e.target.value)}><option value="">Choose (optional)</option><option value="no">No, used my pantry</option><option value="yes">Yes</option></select></label>
          <button className="underline text-sm" onClick={() => { record('mealCompleted', { sessionId: mealSession, recipeId: (adaptedRecipe || providedRecipe).id, rating: mealRating ? Number(mealRating) : null, neededShopping: shopping ? shopping === 'yes' : null }); setActivityMessage('Feedback saved on this device.'); }}>Save feedback</button>
          <p className="text-xs">Activity stays in this account’s browser storage.</p>
        </section>}
        {activityMessage && <p role="status" className="text-sm">{activityMessage}</p>}
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <NutritionPanel key={`${baseRecipe.id}-${baseRecipe.revision || 1}`} recipe={baseRecipe} nutrition={recipe.nutrition} onCalculated={setNutrition} onSaveNutrition={() => { try { saveRecipe(baseRecipe); setSaveError(""); onSaveChange?.(true); } catch(e) { setSaveError(e.message); } }} />
        {/* Bottom Action Toolbar */}
        <div className="recipe-toolbar no-print pt-6 border-t border-[#E3CFB1] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-4 py-2.5 rounded-lg text-xs font-bold border" onClick={() => setShowEditor(true)}>{baseRecipe.structured ? 'Edit recipe' : 'Convert legacy recipe'}</button>
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

      {showEditor && <RecipeEditor recipe={baseRecipe} onClose={() => setShowEditor(false)} onSave={updated => { applyIngredientSwap(updated); setShowEditor(false); onSaveChange?.(true); }} />}
      {/* Cooking Mode Modal */}
      {showCookingMode && (
        <CookingModeModal
          recipe={{ ...recipe, ingredients: scaledIngredients }}
          sessionId={mealSession?.startsWith("temporary-") ? undefined : mealSession}
          onComplete={completeMeal}
          onClose={() => setShowCookingMode(false)}
        />
      )}

      {/* Smart Swap Modal */}
      {swapTarget !== null && (
        <SmartSwapModal
          ingredient={recipe.structured?.ingredients[swapTarget]}
          recipe={recipe}
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
