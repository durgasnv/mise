import { useEffect, useState } from "react";
import { deleteRecipe, getSavedRecipes, saveRecipe } from "../lib/savedRecipes";

const FILTERS = [
  { id: "all", label: "All recipes" },
  { id: "smokehouse", label: "Smoke & char" },
  { id: "quick", label: "15 minutes" },
];

export function SavedPage({ onBack, onOpenRecipe }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [deletedUndoItem, setDeletedUndoItem] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    setRecipes(getSavedRecipes());
  }, []);

  function handleDelete(id, event) {
    event.stopPropagation();
    const { updated, deleted } = deleteRecipe(id);
    setRecipes(updated);
    setDeletedUndoItem(deleted);
    setToastMessage(`“${deleted?.title || "Recipe"}” removed`);
    setTimeout(() => {
      setDeletedUndoItem(null);
      setToastMessage("");
    }, 5000);
  }

  function handleUndo() {
    if (!deletedUndoItem) return;
    setRecipes(saveRecipe(deletedUndoItem));
    setDeletedUndoItem(null);
    setToastMessage("Recipe restored");
    setTimeout(() => setToastMessage(""), 3000);
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const query = search.toLowerCase();
    const matchesSearch = !query ||
      recipe.title?.toLowerCase().includes(query) ||
      recipe.ingredients?.some((item) => item.toLowerCase().includes(query)) ||
      recipe.tags?.some((tag) => tag.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (activeFilter === "quick") return /10|15/.test(recipe.prepTime || "");
    if (activeFilter === "smokehouse") {
      return recipe.tags?.some((tag) => tag.toLowerCase().includes("smoke")) ||
        /smoke|corn|char/i.test(recipe.title || "");
    }
    return true;
  });

  return (
    <div className="app-page cookbook-page min-h-screen pb-24">
      <div className="app-subnav">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button type="button" onClick={onBack}>← Back to kitchen</button>
          <span>{recipes.length.toString().padStart(2, "0")} saved recipes</span>
        </div>
      </div>

      <main className="app-shell max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="cookbook-hero">
          <span className="micro-label">Your private collection</span>
          <h1>Recipes worth<br /><em>returning to.</em></h1>
          <div className="cookbook-hero-side">
            <p>Everything you saved, organized for the next time hunger arrives before inspiration.</p>
            <button type="button" className="editorial-button" onClick={onBack}>Create a new recipe <span>→</span></button>
          </div>
        </header>

        <section className="cookbook-controls" aria-label="Recipe filters">
          <label className="cookbook-search">
            <span>Search collection</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, ingredient, or tag"
            />
          </label>
          <div className="cookbook-filters">
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={activeFilter === filter.id ? "active" : ""}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {filteredRecipes.length > 0 ? (
          <section className="cookbook-grid">
            {filteredRecipes.map((recipe, index) => (
              <article
                key={recipe.id}
                className="cookbook-card"
                onClick={() => onOpenRecipe(recipe)}
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter") onOpenRecipe(recipe); }}
              >
                <div className="cookbook-card-top">
                  <span>({String(index + 1).padStart(2, "0")})</span>
                  <span>{recipe.prepTime || "20 min"}</span>
                  <button type="button" onClick={(event) => handleDelete(recipe.id, event)} aria-label={`Delete ${recipe.title}`}>Remove</button>
                </div>
                <div className="cookbook-card-body">
                  <p>{recipe.tags?.slice(0, 2).join(" / ") || "Mise original"}</p>
                  <h2>{recipe.title}</h2>
                  <ul>
                    {recipe.ingredients?.slice(0, 3).map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
                  </ul>
                </div>
                <div className="cookbook-card-foot">
                  <span>{recipe.servings || "2 portions"}</span>
                  <span>Open recipe ↗</span>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="cookbook-empty">
            <span className="empty-mark">✦</span>
            <h2>{search ? "Nothing matched that search." : "Your cookbook is waiting."}</h2>
            <p>{search ? "Try another ingredient, title, or filter." : "Build a recipe in the kitchen and save the ones you want to cook again."}</p>
            <button type="button" className="editorial-button" onClick={onBack}>Open the kitchen <span>→</span></button>
          </section>
        )}
      </main>

      {toastMessage && (
        <div className="editorial-toast">
          <span>{toastMessage}</span>
          {deletedUndoItem && <button type="button" onClick={handleUndo}>Undo</button>}
        </div>
      )}
    </div>
  );
}
