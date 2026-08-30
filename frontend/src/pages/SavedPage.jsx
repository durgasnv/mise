import { useState, useEffect } from "react";
import { getSavedRecipes, deleteRecipe, saveRecipe } from "../lib/savedRecipes";

export function SavedPage({ onBack, onOpenRecipe }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [deletedUndoItem, setDeletedUndoItem] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadRecipes();
  }, []);

  function loadRecipes() {
    setRecipes(getSavedRecipes());
  }

  function handleDelete(id, e) {
    e.stopPropagation();
    const { updated, deleted } = deleteRecipe(id);
    setRecipes(updated);
    setDeletedUndoItem(deleted);
    setToastMessage(`"${deleted?.title || "Recipe"}" removed from cookbook`);

    setTimeout(() => {
      setDeletedUndoItem(null);
      setToastMessage("");
    }, 5000);
  }

  function handleUndo() {
    if (deletedUndoItem) {
      const updated = saveRecipe(deletedUndoItem);
      setRecipes(updated);
      setDeletedUndoItem(null);
      setToastMessage("Recipe restored to cookbook!");
      setTimeout(() => setToastMessage(""), 3000);
    }
  }

  const filteredRecipes = recipes.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.title?.toLowerCase().includes(q) ||
      r.ingredients?.some((i) => i.toLowerCase().includes(q)) ||
      r.tags?.some((t) => t.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeFilter === "quick") {
      return r.prepTime?.toLowerCase().includes("15") || r.prepTime?.toLowerCase().includes("10");
    }
    if (activeFilter === "smokehouse") {
      return (
        r.tags?.some((t) => t.toLowerCase().includes("smoke")) ||
        r.title?.toLowerCase().includes("smoke") ||
        r.title?.toLowerCase().includes("corn")
      );
    }
    return true;
  });

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
              <span>Back to Kitchen</span>
            </button>
            <span className="text-[#EDE3D3]">•</span>
            <span className="text-xs font-typewriter font-bold text-[#334D66] uppercase">
              The Pantry Cookbook
            </span>
          </div>

          <span className="text-xs font-typewriter text-[#636951]">
            {recipes.length} Saved {recipes.length === 1 ? "Feast" : "Feasts"}
          </span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EDE3D3] pb-6">
          <div>
            <span className="text-xs font-typewriter font-bold text-[#636951] uppercase tracking-widest">
              Personal Recipe Collection
            </span>
            <h1 className="font-display text-3xl sm:text-5xl text-[#334D66] mt-1">
              The Smokehouse Cookbook
            </h1>
            <p className="text-sm font-serif text-[#636951] mt-2">
              Every dish crafted in your kitchen, bookmarked for your next meal.
            </p>
          </div>

          <button
            onClick={onBack}
            className="self-start sm:self-auto px-5 py-2.5 rounded-loro text-xs font-bold font-typewriter uppercase tracking-wider text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer transition-all"
          >
            + Create New Recipe
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ingredient, tag..."
              className="w-full bg-[#FFFDF9] border border-[#EDE3D3] rounded-lg px-4 py-2.5 pl-9 text-sm text-[#334D66] placeholder-[#8EA4B8] outline-none focus:border-[#E56960] transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              🔍
            </span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-typewriter font-bold transition-all ${
                activeFilter === "all"
                  ? "bg-[#334D66] text-[#FBF0DF]"
                  : "bg-[#FFFDF9] text-[#636951] border border-[#EDE3D3] hover:bg-[#FBF0DF]"
              }`}
            >
              All ({recipes.length})
            </button>

            <button
              onClick={() => setActiveFilter("smokehouse")}
              className={`px-3 py-1.5 rounded-full text-xs font-typewriter font-bold transition-all ${
                activeFilter === "smokehouse"
                  ? "bg-[#334D66] text-[#FBF0DF]"
                  : "bg-[#FFFDF9] text-[#636951] border border-[#EDE3D3] hover:bg-[#FBF0DF]"
              }`}
            >
              Smokehouse
            </button>

            <button
              onClick={() => setActiveFilter("quick")}
              className={`px-3 py-1.5 rounded-full text-xs font-typewriter font-bold transition-all ${
                activeFilter === "quick"
                  ? "bg-[#334D66] text-[#FBF0DF]"
                  : "bg-[#FFFDF9] text-[#636951] border border-[#EDE3D3] hover:bg-[#FBF0DF]"
              }`}
            >
              ⚡ 15-Min Fast
            </button>
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => onOpenRecipe(recipe)}
                className="paper-card rounded-loro p-6 border border-[#EDE3D3] flex flex-col justify-between hover:border-[#E56960] hover:shadow-loro transition-all cursor-pointer group"
              >
                <div>
                  {/* Top Meta info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-typewriter font-bold text-[#E56960] bg-[#E56960]/10 px-2 py-0.5 rounded-full">
                      ⏱️ {recipe.prepTime || "20 Mins"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(recipe.id, e)}
                      title="Remove from cookbook"
                      className="text-gray-300 hover:text-[#E56960] text-sm p-1 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-2xl text-[#334D66] group-hover:text-[#E56960] transition-colors leading-snug mb-3">
                    {recipe.title}
                  </h3>

                  {/* Ingredients preview */}
                  <div className="space-y-1 mb-4">
                    <div className="text-[10px] font-typewriter text-[#636951] font-bold uppercase tracking-wider">
                      Ingredients ({recipe.ingredients?.length || 0}):
                    </div>
                    <ul className="text-xs text-[#334D66] line-clamp-3 space-y-0.5 font-medium">
                      {recipe.ingredients?.map((ing, idx) => (
                        <li key={idx} className="truncate">• {ing}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-[#EDE3D3] flex items-center justify-between">
                  <span className="text-xs font-typewriter font-bold text-[#636951] group-hover:text-[#334D66] transition-colors">
                    View Recipe →
                  </span>
                  <span className="text-[10px] font-typewriter text-[#8EA4B8]">
                    {recipe.servings || "2 portions"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-[#FFFDF9] rounded-loro-lg border border-[#EDE3D3] p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FBF0DF] border border-[#EDE3D3] flex items-center justify-center text-2xl mx-auto">
              🍳
            </div>
            <h3 className="font-display text-2xl text-[#334D66]">
              {search ? "No matching recipes found" : "Your Cookbook is Empty"}
            </h3>
            <p className="text-sm font-serif text-[#636951] max-w-md mx-auto">
              {search
                ? `No feasts match "${search}". Try searching for another ingredient or reset the filter.`
                : "Open your fridge, name three ingredients in the kitchen workbench, and save your favorites here."}
            </p>
            <div className="pt-2">
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-loro text-xs font-bold font-typewriter uppercase tracking-wider text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer"
              >
                + Stoke The Kitchen
              </button>
            </div>
          </div>
        )}

        {/* Undo Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#334D66] text-[#FBF0DF] px-5 py-3.5 rounded-loro shadow-loro-lg flex items-center gap-4 border border-[#4A6987] animate-bounce">
            <span className="text-sm font-medium">{toastMessage}</span>
            {deletedUndoItem && (
              <button
                onClick={handleUndo}
                className="text-xs font-typewriter font-bold uppercase text-[#FFBDA6] hover:text-white underline underline-offset-2"
              >
                Undo
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
