import { readAccountData, writeAccountData, newId } from './accountStore.js';
import { validCookbookRecipe } from './savedRecipes.js';
import { scaleStructuredRecipe } from '../../../shared/recipe-scaling.js';
function validate(plan) {
  if (plan?.version !== 1 || !Array.isArray(plan.entries) || plan.entries.length > 21 || new Set(plan.entries.map(e => e.id)).size !== plan.entries.length) throw new Error('Invalid meal plan.');
  for (const entry of plan.entries) {
    if (!entry || typeof entry.id !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || new Date(`${entry.date}T00:00:00Z`).toISOString().slice(0, 10) !== entry.date || !validCookbookRecipe(entry.recipe) || !entry.recipe.structured) throw new Error('Choose a date and a structured saved recipe.');
    scaleStructuredRecipe(entry.recipe.structured, entry.servings);
  }
}
export function getMealPlan(owner) { return readAccountData('plan_v1', { version: 1, entries: [] }, validate, owner); }
export function addPlannedMeal(date, recipe, servings, owner) {
  const plan = getMealPlan(owner);
  plan.entries.push({ id: newId(), date, recipe: structuredClone(recipe), servings });
  return writeAccountData('plan_v1', plan, validate, owner);
}
export function removePlannedMeal(id, owner) {
  const plan = getMealPlan(owner); plan.entries = plan.entries.filter(e => e.id !== id);
  return writeAccountData('plan_v1', plan, validate, owner);
}
