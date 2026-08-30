const STORAGE_KEY = "mise_saved_recipes_v2";

const STARTER_RECIPES = [
  {
    id: "sample-1",
    title: "Smoked Garlic & Sweet Corn Sauté",
    prepTime: "15 mins",
    cookTime: "10 mins",
    servings: "2-3 portions",
    basePortions: 2,
    calories: "~460 kcal",
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
    pairing: "Smoky Lemon Iced Green Tea with fresh mint",
    quickSide: "Pickled Cucumber Ribbons with toasted sesame",
    chefNote: "Pair with a squeeze of charred lime for authentic smokehouse zest.",
    tags: ["Quick Sauté", "Sweet Corn", "Vegetarian"],
    createdAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "sample-2",
    title: "Crispy Cast-Iron Chicken Thighs with Rosemary & Shallot",
    prepTime: "15 mins",
    cookTime: "25 mins",
    servings: "2 portions",
    basePortions: 2,
    calories: "~520 kcal",
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
    pairing: "Charred Citrus Highball with a twist of lemon",
    quickSide: "Whipped Garlic-Miso Butter with warm flatbread",
    chefNote: "Baste the crisp chicken with the fragrant rosemary pan jus before plating.",
    tags: ["Crispy Cast-Iron", "High Protein", "Comfort Feast"],
    createdAt: "2026-08-02T14:30:00.000Z",
  },
  {
    id: "sample-3",
    title: "Gochujang Glazed Shiitake Ramen Sauté",
    prepTime: "10 mins",
    cookTime: "12 mins",
    servings: "2 portions",
    basePortions: 2,
    calories: "~480 kcal",
    ingredients: [
      "2 packs Ramen noodles, boiled al dente",
      "200g Shiitake mushrooms, sliced",
      "1.5 tbsp Gochujang chili paste",
      "1 tbsp Soy sauce & 1 tsp sesame oil",
      "1 Soft-boiled egg for topping",
    ],
    instructions: [
      "Boil ramen noodles for 2 minutes, drain and rinse with cold water.",
      "In a hot skillet, sear shiitake mushrooms in sesame oil until deeply browned.",
      "Stir in gochujang and soy sauce with 2 tbsp hot water to form a glossy glaze.",
      "Toss noodles vigorously in the sauce, plate in bowls, and top with soft-boiled egg.",
    ],
    pairing: "Ginger-Yuzu Sparkling Tonic",
    quickSide: "Sesame Scallion Slaw with chili flakes",
    chefNote: "Rinsing noodles in cold water keeps them bouncy and chewy.",
    tags: ["Asian Fusion", "Fast 15-Min", "Umami Rich"],
    createdAt: "2026-08-03T16:00:00.000Z",
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
    window.dispatchEvent(new Event("storage"));
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
    window.dispatchEvent(new Event("storage"));
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
