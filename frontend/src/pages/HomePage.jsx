import { useState, useRef } from "react";
import { IngredientForm } from "../components/IngredientForm";
import { MultiRecipeStack } from "../components/MultiRecipeStack";
import { generateRecipeApi } from "../lib/api";
import { parseRecipeResponse, createFallbackRecipes } from "../lib/parseRecipes";

const KITCHEN_TIPS = [
  {
    icon: "01",
    title: "Cast-Iron Preheat",
    text: "Always let your cast iron skillet get screaming hot before searing for deep Maillard browning.",
  },
  {
    icon: "02",
    title: "The Acid Splash",
    text: "If a dish tastes heavy, a splash of lime juice or rice vinegar instantly brightens all flavors.",
  },
  {
    icon: "03",
    title: "Brown Butter Secret",
    text: "Toasting butter until golden nutty transforms simple sweet corn and veggies into a luxury side.",
  },
];

const LOADING_MESSAGES = [
  "Firing up the culinary hearth...",
  "Balancing acid, smoke, and savory aromatics...",
  "Crafting 3 distinct cooking methods...",
  "Pairing craft beverages and companion sides...",
  "Finishing with pitmaster tasting notes...",
];

export function HomePage({ onBack, onViewSaved, initialIngredients }) {
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const recipeRef = useRef(null);

  async function handleGenerate({ question, ingredients, image }) {
    setIsLoading(true);

    const timer = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    try {
      const rawResponse = await generateRecipeApi(question, image);
      const parsedRecipes = parseRecipeResponse(rawResponse, ingredients);
      setRecipes(parsedRecipes);

      setTimeout(() => {
        recipeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      console.warn("API notice, applying hearth fallback:", err.message);
      const fallbacks = createFallbackRecipes(ingredients);
      setRecipes(fallbacks);

      setTimeout(() => {
        recipeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  }

  function handleSaveNotification(isSaved) {
    if (isSaved) {
      setToastMessage("★ Recipe saved to your Mise Cookbook!");
    } else {
      setToastMessage("Recipe removed from cookbook");
    }
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleCookAnother() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-page kitchen-page min-h-screen pb-24">
      {/* Studio Header Breadcrumb */}
      <div className="app-subnav bg-[#E3CFB1]/50 border-b border-[#E3CFB1] py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs font-typewriter font-bold text-[#6D5545] hover:text-[#F2382F] flex items-center gap-1 transition-colors"
            >
              <span>←</span>
              <span>Home</span>
            </button>
            <span className="text-[#E3CFB1]">•</span>
            <span className="text-xs font-typewriter font-bold text-[#201B17] uppercase">
              The kitchen / Compose
            </span>
          </div>

          <button
            onClick={onViewSaved}
            className="text-xs font-typewriter font-bold text-[#201B17] hover:text-[#F2382F] underline underline-offset-4"
          >
            View cookbook ↗
          </button>
        </div>
      </div>

      <main className="app-shell max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-12">
        <header className="kitchen-intro">
          <span className="micro-label">01 / Pantry composition</span>
          <h1>What are we<br /><em>working with?</em></h1>
          <p>Name what you have. Mise will find three considered ways to turn it into dinner.</p>
        </header>
        {/* Top Grid: Form + Kitchen Tips */}
        <div className="kitchen-grid grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Ingredient Form (8 cols) */}
          <div className="lg:col-span-8">
            <IngredientForm
              onSubmit={handleGenerate}
              isLoading={isLoading}
              initialIngredients={initialIngredients}
            />
          </div>

          {/* Kitchen Wisdom & Tips Sidebar (4 cols) */}
          <aside className="kitchen-aside lg:col-span-4 space-y-6">
            <div className="paper-card p-6 rounded-loro-lg border border-[#E3CFB1] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E3CFB1] pb-3">
                <span className="text-[#F2382F]">✦</span>
                <h3 className="font-display text-lg text-[#201B17]">
                  Notes from the kitchen
                </h3>
              </div>

              <div className="space-y-4">
                {KITCHEN_TIPS.map((tip, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-typewriter font-bold text-[#201B17]">
                      <span>{tip.icon}</span>
                      <span>{tip.title}</span>
                    </div>
                    <p className="text-xs text-[#6D5545] leading-relaxed pl-5">
                      {tip.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Inspiration Card */}
            <div className="kitchen-manifesto bg-[#201B17] text-[#F5E6CC] p-6 rounded-loro-lg border border-[#201B17] space-y-2">
              <span className="text-[11px] font-typewriter text-[#F3C694] font-bold uppercase tracking-wider">
                The Mise method
              </span>
              <h4 className="font-display text-xl text-white">
                Everything in its place
              </h4>
              <p className="text-xs text-[#F5E6CC]/80 font-serif leading-relaxed">
                Whether you have 3 items or a full pantry, high heat and good seasoning create unforgettable meals.
              </p>
            </div>
          </aside>
        </div>

        {/* Loading Live Display */}
        {isLoading && (
          <div className="kitchen-loading py-16 text-center space-y-4 bg-white/80 rounded-loro-lg border border-[#E3CFB1] shadow-loro p-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F2382F]/10 text-[#F2382F] text-xs font-typewriter font-bold uppercase tracking-wider">
              <span>02 / Composing three directions</span>
            </div>

            <div className="flex justify-center gap-2 py-3">
              <span className="simmer-dot" />
              <span className="simmer-dot" />
              <span className="simmer-dot" />
            </div>

            <p className="font-display text-2xl text-[#201B17] transition-all duration-300">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>

            <p className="text-xs font-typewriter text-[#6D5545]">
              Balancing sear times, slow braises, and crunchy textures for your ingredients...
            </p>
          </div>
        )}

        {/* Render Generated Top 3 Stacked Recipe Cards */}
        {recipes && !isLoading && (
          <div ref={recipeRef} className="recipe-results pt-4 scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#6D5545] flex items-center gap-1.5">
                <span>✦</span> 02 / Choose a direction
              </span>
              <button
                onClick={handleCookAnother}
                className="text-xs font-typewriter font-bold text-[#F2382F] hover:underline"
              >
                Edit ingredients ↑
              </button>
            </div>

            <MultiRecipeStack
              recipes={recipes}
              onSaveChange={handleSaveNotification}
              onCookAnother={handleCookAnother}
            />
          </div>
        )}

        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#201B17] text-[#F5E6CC] px-5 py-3 rounded-loro shadow-loro-lg border border-[#5E4A3D] text-sm font-medium flex items-center gap-2 animate-toast-enter">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  );
}
