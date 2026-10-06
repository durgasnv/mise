import { readAccountData, writeAccountData, newId } from './accountStore.js';
import { validCookbookRecipe } from './savedRecipes.js';
import { scaleStructuredRecipe } from '../../../shared/recipe-scaling.js';
export function validateMealPlan(plan) {
  if (plan?.version !== 1 || !Array.isArray(plan.entries) || plan.entries.length > 21 || new Set(plan.entries.map(e => e.id)).size !== plan.entries.length) throw new Error('Invalid meal plan.');
  for (const entry of plan.entries) {
    if (!entry || typeof entry.id !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || new Date(`${entry.date}T00:00:00Z`).toISOString().slice(0, 10) !== entry.date || !validCookbookRecipe(entry.recipe) || !entry.recipe.structured) throw new Error('Choose a date and a structured saved recipe.');
    scaleStructuredRecipe(entry.recipe.structured, entry.servings);
  }
}
export function getMealPlan(owner) { return readAccountData('plan_v1', { version: 1, entries: [] }, validateMealPlan, owner); }
export function addPlannedMeal(date, recipe, servings, owner) {
  const plan = getMealPlan(owner);
  plan.entries.push({ id: newId(), date, recipe: structuredClone(recipe), servings });
  return writeAccountData('plan_v1', plan, validateMealPlan, owner);
}
export function removePlannedMeal(id, owner) {
  const plan = getMealPlan(owner); plan.entries = plan.entries.filter(e => e.id !== id);
  return writeAccountData('plan_v1', plan, validateMealPlan, owner);
}

export function repeatPlanWeek(start, owner) {
  const plan = getMealPlan(owner);
  const end = new Date(`${start}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + 7);
  if (Number.isNaN(end.getTime())) throw new Error('Choose a valid week.');
  const source = plan.entries.filter(e => e.date >= start && e.date < end.toISOString().slice(0,10) && e.kind !== 'leftover');
  if (!source.length) throw new Error('Add a dinner to this week before repeating it.');
  for (const entry of source) {
    const next = new Date(`${entry.date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 7);
    const date = next.toISOString().slice(0,10), repeatKey = `${entry.id}:${date}`;
    if (!plan.entries.some(e => e.repeatKey === repeatKey)) plan.entries.push({ ...structuredClone(entry), id: newId(), date, repeatKey });
  }
  return writeAccountData('plan_v1', plan, validateMealPlan, owner);
}
export function addLeftoverMeal(date, leftover, servings, owner) {
  const plan = getMealPlan(owner);
  const reserved = plan.entries.filter(e => e.leftoverId === leftover?.id).reduce((sum,e) => sum + e.servings, 0);
  if (!leftover || servings + reserved > leftover.portions) throw new Error('Not enough unplanned leftover portions remain.');
  plan.entries.push({ id: newId(), date, recipe: structuredClone(leftover.recipe), servings, kind: 'leftover', leftoverId: leftover.id });
  return writeAccountData('plan_v1', plan, validateMealPlan, owner);
}
