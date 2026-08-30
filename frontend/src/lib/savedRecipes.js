const STORAGE_KEY = "fridge2feast_saved_recipes_v1";

const STARTER_RECIPES = [
  {
    id: "sample-1",
    title: "Smoked Garlic & Sweet Corn Sauté",
    prepTime: "15 mins",
    servings: "2-3 portions",
    ingredients: [
      "2 ears Fresh sweet corn, cut off the cob",
      "4 cloves Garlic, finely slivered",
      "2 tbsp Cultured butter or olive oil",
      "Pinch of smoked sea salt & cracked black pepper",
      "Fresh cilantro or scallions for garnish",
    ],
    instructions: [
      "Heat a heavy skillet over medium-high heat until hot.",
      "Melt butter and add slivered garlic, toasting for 45 seconds until aromatic and pale golden.",
      "Add fresh sweet corn kernels and let char undisturbed for 2-3 minutes for deep smokehouse flavor.",
      "Toss together, season with smoked salt and pepper, and finish with freshly torn herbs.",
    ],
    chefNote: "Pair with a squeeze of charred lime for authentic smokehouse zest.",
    tags: ["Smokehouse Special", "Sweet Corn", "Vegetarian"],
    createdAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "sample-2",
    title: "Crispy Cast-Iron Chicken Thighs with Rosemary & Shallot",
    prepTime: "25 mins",
    servings: "2 portions",
    ingredients: [
      "4 Bone-in chicken thighs, patted dry",
      "3 Shallots, quartered",
      "2 sprigs Fresh woody rosemary",
      "Coarse kosher salt & black pepper",
    ],
    instructions: [
      "Season chicken thighs generously on all sides with kosher salt and pepper.",
      "Place skin-side down in a cold cast-iron skillet and turn heat to medium-low to slowly render the fat.",
      "Cook for 12-14 minutes until the skin is deep golden amber and shatteringly crisp.",
      "Flip, toss quartered shallots and rosemary into the rendered pan juices, and cook 8 more minutes until done.",
    ],
    chefNote: "Baste the crisp chicken with the fragrant rosemary pan jus before plating.",
    tags: ["Cast Iron", "High Protein", "Comfort Feast"],
    createdAt: "2026-08-02T14:30:00.000Z",
  },
];

/**
 * Retrieves all saved recipes from localStorage.
 * @returns {Array<object>}
 */
export function getSavedRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_RECIPES));
      return STARTER_RECIPES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading saved recipes:", err);
    return STARTER_RECIPES;
  }
}

/**
 * Saves a new recipe to localStorage.
 * @param {object} recipe
 * @returns {Array<object>}
 */
export function saveRecipe(recipe) {
  if (!recipe || !recipe.title) return getSavedRecipes();

  const current = getSavedRecipes();
  const existsIndex = current.findIndex(
    (r) => r.id === recipe.id || (r.title.toLowerCase() === recipe.title.toLowerCase())
  );

  let updated;
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = { ...recipe, savedAt: new Date().toISOString() };
  } else {
    updated = [{ ...recipe, savedAt: new Date().toISOString() }, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving recipe:", err);
  }
  return updated;
}

/**
 * Deletes a recipe by ID.
 * @param {string} id
 * @returns {{ updated: Array<object>, deleted: object | null }}
 */
export function deleteRecipe(id) {
  const current = getSavedRecipes();
  const deleted = current.find((r) => r.id === id) || null;
  const updated = current.filter((r) => r.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error deleting recipe:", err);
  }
  return { updated, deleted };
}

/**
 * Checks if a recipe is saved.
 * @param {string} [id]
 * @param {string} [title]
 * @returns {boolean}
 */
export function isRecipeSaved(id, title) {
  const current = getSavedRecipes();
  return current.some(
    (r) => (id && r.id === id) || (title && r.title.toLowerCase() === title.toLowerCase())
  );
}

/**
 * Toggles the save status of a recipe.
 * @param {object} recipe
 * @returns {{ isSaved: boolean, recipes: Array<object> }}
 */
export function toggleSaveRecipe(recipe) {
  if (isRecipeSaved(recipe.id, recipe.title)) {
    const { updated } = deleteRecipe(recipe.id);
    return { isSaved: false, recipes: updated };
  } else {
    const updated = saveRecipe(recipe);
    return { isSaved: true, recipes: updated };
  }
}
