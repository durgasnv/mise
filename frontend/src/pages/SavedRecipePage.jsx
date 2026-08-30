import { RecipeCard } from "../components/RecipeCard";

export function SavedRecipePage({ recipe, onBack, onCookNew }) {
  if (!recipe) {
    return (
      <div className="min-h-screen max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-display text-3xl text-[#334D66]">Recipe not found</h2>
        <p className="text-sm text-[#636951]">The requested recipe may have been removed.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-loro text-xs font-bold font-typewriter uppercase bg-[#334D66] text-[#FBF0DF]"
        >
          ← Return to Cookbook
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header Breadcrumb */}
      <div className="bg-[#EDE3D3]/50 border-b border-[#EDE3D3] py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs font-typewriter font-bold text-[#636951] hover:text-[#E56960] flex items-center gap-1 transition-colors"
            >
              <span>←</span>
              <span>Cookbook</span>
            </button>
            <span className="text-[#EDE3D3]">•</span>
            <span className="text-xs font-typewriter font-bold text-[#334D66] truncate max-w-xs sm:max-w-md">
              {recipe.title}
            </span>
          </div>

          <button
            onClick={onCookNew || onBack}
            className="text-xs font-typewriter font-bold text-[#E56960] hover:text-[#C94F46]"
          >
            + New Kitchen Feast
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <RecipeCard
          recipe={recipe}
          onCookAnother={onCookNew}
        />
      </main>
    </div>
  );
}
