import { useState, useRef } from "react";
import { IngredientForm } from "../components/IngredientForm";
import { RecipeCard } from "../components/RecipeCard";
import { generateRecipeApi } from "../lib/api";
import { parseRecipeResponse, createFallbackRecipe } from "../lib/parseRecipes";

const KITCHEN_TIPS = [
  {
    icon: "🔥",
    title: "Cast-Iron Preheat",
    text: "Always let your cast iron skillet get screaming hot before searing for deep Maillard browning.",
  },
  {
    icon: "🍋",
    title: "The Acid Splash",
    text: "If a dish tastes heavy, a splash of lime juice or rice vinegar instantly brightens all flavors.",
  },
  {
    icon: "🧈",
    title: "Brown Butter Secret",
    text: "Toasting butter until golden nutty transforms simple sweet corn and veggies into a luxury side.",
  },
];

const LOADING_MESSAGES = [
  "Firing up the culinary hearth...",
  "Balancing acid, smoke, and savory aromatics...",
  "Crafting step-by-step culinary method...",
  "Finishing with chef's pairing notes...",
];

export function HomePage({ onBack, onViewSaved, initialIngredients }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const recipeRef = useRef(null);

  async function handleGenerate({ question, ingredients, image }) {
    setIsLoading(true);
    setError(null);

    // Cycle through culinary loading messages
    const timer = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);

    try {
      const rawResponse = await generateRecipeApi(question, image);
      const parsed = parseRecipeResponse(rawResponse, ingredients);
      setCurrentRecipe(parsed);

      setTimeout(() => {
        recipeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      console.error("Recipe generation error:", err);
      setError(err.message || "Failed to generate recipe. Using scratch kitchen backup.");
      // Fallback recipe so the user never encounters a blank crash screen
      const fallback = createFallbackRecipe(ingredients);
      setCurrentRecipe(fallback);
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  }

  function handleCookAnother() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Studio Header Breadcrumb */}
      <div className="bg-[#EDE3D3]/50 border-b border-[#EDE3D3] py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs font-typewriter font-bold text-[#636951] hover:text-[#E56960] flex items-center gap-1 transition-colors"
            >
              <span>←</span>
              <span>Landing</span>
            </button>
            <span className="text-[#EDE3D3]">•</span>
            <span className="text-xs font-typewriter font-bold text-[#334D66] uppercase">
              The AI Kitchen Workbench
            </span>
          </div>

          <button
            onClick={onViewSaved}
            className="text-xs font-typewriter font-bold text-[#334D66] hover:text-[#E56960] underline underline-offset-4"
          >
            Open Cookbook →
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-12">
        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-loro bg-[#FFF3EE] border border-[#E56960] text-[#334D66] text-sm flex items-start justify-between gap-3">
            <div>
              <span className="font-bold text-[#E56960]">Notice: </span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[#E56960] font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Grid: Form + Kitchen Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Ingredient Form (8 cols) */}
          <div className="lg:col-span-8">
            <IngredientForm
              onSubmit={handleGenerate}
              isLoading={isLoading}
              initialIngredients={initialIngredients}
            />
          </div>

          {/* Kitchen Wisdom & Tips Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="paper-card p-6 rounded-loro-lg border border-[#EDE3D3] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#EDE3D3] pb-3">
                <span className="text-[#E56960]">✦</span>
                <h3 className="font-display text-lg text-[#334D66]">
                  Smokehouse Kitchen Secrets
                </h3>
              </div>

              <div className="space-y-4">
                {KITCHEN_TIPS.map((tip, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-typewriter font-bold text-[#334D66]">
                      <span>{tip.icon}</span>
                      <span>{tip.title}</span>
                    </div>
                    <p className="text-xs text-[#636951] leading-relaxed pl-5">
                      {tip.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Inspiration Card */}
            <div className="bg-[#334D66] text-[#FBF0DF] p-6 rounded-loro-lg border border-[#334D66] space-y-2">
              <span className="text-[11px] font-typewriter text-[#FFBDA6] font-bold uppercase tracking-wider">
                Kitchen Rule of Three
              </span>
              <h4 className="font-display text-xl text-white">
                1 Protein + 1 Veg + 1 Flavor
              </h4>
              <p className="text-xs text-[#FBF0DF]/80 font-serif leading-relaxed">
                The golden balance used by top chefs. Keep it simple, season well, and let high heat do the work.
              </p>
            </div>
          </div>
        </div>

        {/* Loading Live Display */}
        {isLoading && (
          <div className="py-16 text-center space-y-4 bg-white/80 rounded-loro-lg border border-[#EDE3D3] shadow-loro p-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E56960]/10 text-[#E56960] text-xs font-typewriter font-bold uppercase tracking-wider">
              <span>🔥 Hearth In Progress</span>
            </div>

            <div className="flex justify-center gap-2 py-3">
              <span className="simmer-dot" />
              <span className="simmer-dot" />
              <span className="simmer-dot" />
            </div>

            <p className="font-display text-2xl text-[#334D66] transition-all duration-300">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>

            <p className="text-xs font-typewriter text-[#636951]">
              Consulting master cooking techniques for your pantry items...
            </p>
          </div>
        )}

        {/* Render Generated Recipe Card */}
        {currentRecipe && !isLoading && (
          <div ref={recipeRef} className="pt-4 scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#636951] flex items-center gap-1.5">
                <span>✦</span> Step 02 • Your Custom Recipe
              </span>
              <button
                onClick={handleCookAnother}
                className="text-xs font-typewriter font-bold text-[#E56960] hover:underline"
              >
                ↑ Edit Ingredients
              </button>
            </div>

            <RecipeCard
              recipe={currentRecipe}
              onCookAnother={handleCookAnother}
            />
          </div>
        )}
      </main>
    </div>
  );
}
