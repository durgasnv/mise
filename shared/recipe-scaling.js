import { validateRecipes, recipeView } from './recipes.js';
import { reviewPantry } from './pantry.js';
import { reviewSafety } from './recipe-safety.js';
export function scaleStructuredRecipe(recipe, portions) {
  validateRecipes({ recipes: [recipe] });
  if (!Number.isInteger(portions) || portions < 1 || portions > 12) throw new Error('Choose 1 to 12 servings.');
  const factor = portions / recipe.servings;
  return { ...recipe, servings: portions, ingredients: recipe.ingredients.map(i => ({
    ...i, quantity: i.quantity * factor, quantityMax: i.quantityMax === null ? null : i.quantityMax * factor,
  })) };
}
export function scaledRecipeView(saved, portions) {
  // Legacy text has no trustworthy ingredient/method linkage. Preserve it exactly.
  if (!saved.structured) return saved;
  const structured = scaleStructuredRecipe(saved.structured, portions);
  const constraints = { ...saved.constraints, servings: portions, strictPantry: false };
  const review = saved.constraints ? { ...reviewPantry(structured, constraints), ...reviewSafety(structured, constraints) } : saved.review;
  return recipeView(structured, { id: saved.id, constraints: saved.constraints, review });
}
