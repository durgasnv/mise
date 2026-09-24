import { RecipeCard } from "../components/RecipeCard";

export function SavedRecipePage({ recipe, onBack, onCookNew }) {
  if (!recipe) {
    return (
      <div className="app-page recipe-detail-empty min-h-screen max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-display text-3xl text-[#201B17]">Recipe not found</h2>
        <p className="text-sm text-[#6D5545]">The requested recipe may have been removed.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-loro text-xs font-bold font-typewriter uppercase bg-[#201B17] text-[#F5E6CC]"
        >
          ← Return to Cookbook
        </button>
      </div>
    );
  }

  return (
    <div className="app-page recipe-detail-page min-h-screen pb-24">
      {/* Top Header Breadcrumb */}
      <div className="app-subnav bg-[#E3CFB1]/50 border-b border-[#E3CFB1] py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs font-typewriter font-bold text-[#6D5545] hover:text-[#F2382F] flex items-center gap-1 transition-colors"
            >
              <span>←</span>
              <span>Cookbook</span>
            </button>
            <span className="text-[#E3CFB1]">•</span>
            <span className="text-xs font-typewriter font-bold text-[#201B17] truncate max-w-xs sm:max-w-md">
              {recipe.title}
            </span>
          </div>

          <button
            onClick={onCookNew || onBack}
            className="text-xs font-typewriter font-bold text-[#F2382F] hover:text-[#CF2A23]"
          >
            + New Kitchen Feast
          </button>
        </div>
      </div>

      <main className="recipe-detail-shell max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <RecipeCard
          recipe={recipe}
          onCookAnother={onCookNew}
        />
      </main>
    </div>
  );
}
