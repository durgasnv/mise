import { validateRecipes, recipeView } from './recipes.js';
import { validateConstraints } from './pantry.js';
import { reviewPantry } from './pantry.js';
import { reviewSafety } from './recipe-safety.js';
export function editRecipe(original, structured, constraints) {
  validateRecipes({ recipes: [structured] }); const checked = validateConstraints(constraints);
  checked.servings = structured.servings;
  const review = { ...reviewPantry(structured, checked), ...reviewSafety(structured, checked) };
  return { ...recipeView(structured, { id: original.id, constraints: checked, review }),
    revision: (original.revision || 1) + 1, editedAt: new Date().toISOString(), legacySourceId: original.legacySourceId };
}
export function validateLegacyRecipe(raw) {
  if (!raw || typeof raw.title !== 'string' || !raw.title.trim() || raw.title.length > 200) throw new Error('Choose a complete legacy recipe.');
  for (const key of ['ingredients','instructions']) if (!Array.isArray(raw[key]) || !raw[key].length || raw[key].length > 40 || raw[key].some(x => typeof x !== 'string' || !x.trim() || x.length > 2000)) throw new Error('Legacy recipe content is incomplete or too large.');
  const result = { title: raw.title, ingredients: raw.ingredients, instructions: raw.instructions };
  if (JSON.stringify(result).length > 30000) throw new Error('Legacy recipe is too large.');
  return result;
}
