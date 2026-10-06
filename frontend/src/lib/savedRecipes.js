import { validateNutrition } from '../../../shared/nutrition.js';
import { validateRecipes } from "../../../shared/recipes.js";
import { validateConstraints } from "../../../shared/pantry.js";
import { getCurrentUser } from "./auth.js";
const STORAGE_KEY = "mise_saved_recipes_v2";

const STARTER_RECIPES = [
  {
    id: "sample-1",
    title: "Smoked Garlic & Sweet Corn Sauté",
    prepTime: "15 mins",
    cookTime: "10 mins",
    servings: "2-3 portions",
    basePortions: 2,
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
      "Flip, toss quartered shallots and rosemary into the rendered pan juices, and continue cooking until a food thermometer reads at least 74°C / 165°F in the thickest part, away from bone. Timing alone does not establish doneness. Keep raw chicken separate from ready-to-eat food and clean hands and surfaces.",
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
    ingredients: [
      "2 packs Ramen noodles, boiled al dente",
      "200g Shiitake mushrooms, sliced",
      "1.5 tbsp Gochujang chili paste",
      "1 tbsp Soy sauce & 1 tsp sesame oil",
      "1 Hard-boiled egg for topping",
    ],
    instructions: [
      "Boil ramen noodles for 2 minutes, drain and rinse with cold water.",
      "In a hot skillet, sear shiitake mushrooms in sesame oil until deeply browned.",
      "Stir in gochujang and soy sauce with 2 tbsp hot water to form a glossy glaze.",
      "Toss noodles vigorously in the sauce, plate in bowls, and top with hard-boiled egg cooked until both yolk and white are firm.",
    ],
    pairing: "Ginger-Yuzu Sparkling Tonic",
    quickSide: "Sesame Scallion Slaw with chili flakes",
    chefNote: "Rinsing noodles in cold water keeps them bouncy and chewy.",
    tags: ["Asian Fusion", "22 minutes", "Umami Rich"],
    createdAt: "2026-08-03T16:00:00.000Z",
  },
];

export function getStarterRecipes() { return structuredClone(STARTER_RECIPES); }

export function cookbookOwner() {
  const user = getCurrentUser();
  return user?.id && user?.provider ? `${user.provider}:${user.id}` : 'guest';
}
export function cookbookKey(owner = cookbookOwner()) { return `mise_cookbook_v3:${encodeURIComponent(owner)}`; }
export function validCookbookRecipe(r) {
  try {
    if (r?.structured) { validateRecipes({ recipes: [r.structured] }); if (r.constraints) validateConstraints(r.constraints); if (r.nutrition) validateNutrition(r.nutrition, r.structured); }
    if (JSON.stringify(r).length > 100000) return false;
  } catch { return false; }
  return r && typeof r.id === 'string' && r.id.length <= 200 && typeof r.title === 'string' && r.title.length <= 200 &&
    Array.isArray(r.ingredients) && r.ingredients.every(x => typeof x === 'string') && Array.isArray(r.instructions) && r.instructions.every(x => typeof x === 'string') &&
    (!r.tags || Array.isArray(r.tags) && r.tags.every(x => typeof x === 'string'));
}
export function validateCookbookOperations(ops) {
  if (!Array.isArray(ops) || ops.some(op => !op || typeof op.opId !== 'string' || typeof op.id !== 'string' || typeof op.at !== 'number' || !Number.isFinite(op.at) || op.at < 0 || !['save', 'delete'].includes(op.type) || (op.type === 'save' && (!validCookbookRecipe(op.recipe) || op.recipe.id !== op.id)))) throw new Error('Cookbook data is unreadable. The original data has been preserved.');
  return ops;
}
export function mergeCookbooks(...books) {
  const operations = new Map();
  for (const book of books) for (const op of validateCookbookOperations(book.operations || [])) operations.set(op.opId, op);
  return { version: 3, operations: [...operations.values()] };
}
export function recipesFromBook(book) {
  const latest = new Map();
  for (const op of validateCookbookOperations(book.operations)) {
    const prior = latest.get(op.id);
    if (!prior || op.at > prior.at || (op.at === prior.at && op.opId > prior.opId)) latest.set(op.id, op);
  }
  return [...latest.values()].filter(op => op.type === 'save').sort((a, b) => b.at - a.at).map(op => op.recipe);
}
export function readCookbook(owner = cookbookOwner()) {
  const raw = localStorage.getItem(cookbookKey(owner));
  if (raw) {
    const book = JSON.parse(raw); validateCookbookOperations(book.operations);
    return book;
  }
  return { version: 3, operations: owner.startsWith('puter:') ? [] : STARTER_RECIPES.map(recipe => ({ opId: `starter-${recipe.id}`, id: recipe.id, at: 0, type: 'save', recipe })) };
}
export function writeCookbook(book, owner = cookbookOwner()) {
  validateCookbookOperations(book.operations);
  localStorage.setItem(cookbookKey(owner), JSON.stringify(book));
  window.dispatchEvent(new Event('storage'));
}
export function getSavedRecipes() { return recipesFromBook(readCookbook()); }
function mutateBook(type, id, recipe) {
  const owner = cookbookOwner(), book = readCookbook(owner);
  const at = Math.max(Date.now(), ...book.operations.map(op => op.at + 1));
  const op = { type, id, at, opId: globalThis.crypto?.randomUUID?.() || `${at}-${Math.random().toString(36).slice(2)}`, ...(recipe ? { recipe: { ...recipe, savedAt: new Date(at).toISOString() } } : {}) };
  const updated = mergeCookbooks(book, { operations: [op] });
  writeCookbook(updated, owner);
  window.dispatchEvent(new CustomEvent('mise-cookbook-change', { detail: { owner } }));
  return recipesFromBook(updated);
}
export function saveRecipe(recipe) {
  if (!validCookbookRecipe(recipe)) throw new Error('This recipe is incomplete and cannot be saved.');
  return mutateBook('save', recipe.id, recipe);
}
export function deleteRecipe(id) {
  const deleted = getSavedRecipes().find(r => r.id === id) || null;
  return { updated: mutateBook('delete', id), deleted };
}
export function isRecipeSaved(id) { try { return getSavedRecipes().some(r => r.id === id); } catch { return false; } }
export function toggleSaveRecipe(recipe) {
  if (isRecipeSaved(recipe.id)) return { isSaved: false, recipes: deleteRecipe(recipe.id).updated };
  return { isSaved: true, recipes: saveRecipe(recipe) };
}
export function legacyRecipesAvailable() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw || localStorage.getItem('mise_legacy_cookbook_claimed')) return false;
  try { return Array.isArray(JSON.parse(raw)) && JSON.parse(raw).some(validCookbookRecipe); } catch { return false; }
}
export function importLegacyCookbook() {
  if (!legacyRecipesAvailable()) return getSavedRecipes();
  const original = localStorage.getItem(STORAGE_KEY);
  // Never delete or rewrite the legacy file; ownership requires the explicit UI action.
  for (const recipe of JSON.parse(original).filter(validCookbookRecipe)) saveRecipe(recipe);
  localStorage.setItem('mise_legacy_cookbook_claimed', cookbookOwner());
  return getSavedRecipes();
}
