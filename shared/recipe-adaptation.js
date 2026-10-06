import { validateRecipes } from './recipes.js';
import { validateConstraints, canonicalName, UNITS } from './pantry.js';
import { ingredientConflict } from './recipe-safety.js';
export function prepareAdaptation(original, ingredientId, replacement, constraints) {
  validateRecipes({ recipes: [original] });
  const c = validateConstraints(constraints);
  const old = original.ingredients.find(i => i.id === ingredientId);
  if (!old || !replacement || typeof replacement.name !== 'string' || !replacement.name.trim() || replacement.name.length > 120 ||
      !UNITS.includes(replacement.unit) || typeof replacement.quantity !== 'number' || !Number.isFinite(replacement.quantity) || replacement.quantity <= 0 || replacement.quantity > 100000) throw new Error('Confirm the replacement ingredient and the amount you have.');
  if (canonicalName(old.name) === canonicalName(replacement.name)) throw new Error('Choose a different ingredient.');
  const conflict = ingredientConflict(replacement.name, c.restrictions, c.excludedIngredients);
  if (conflict) throw new Error(conflict);
  c.servings = original.servings;
  c.pantry = c.pantry.filter(i => ![canonicalName(old.name), canonicalName(replacement.name)].includes(canonicalName(i.name)));
  c.pantry.push({ name: replacement.name.trim(), quantity: replacement.quantity, unit: replacement.unit });
  c.staples = c.staples.filter(name => canonicalName(name) !== canonicalName(old.name));
  if (c.excludedIngredients.length > 20) throw new Error('Too many excluded ingredients. Start a new pantry request.');
  return { constraints: c, original, ingredientId, replacement };
}
export function validateAdaptedRecipes(recipes, adaptation) {
  if (recipes.length !== 1) throw new Error('Expected one fully adapted recipe.');
  const r = recipes[0], target = canonicalName(adaptation.replacement.name);
  const added = r.ingredients.find(i => canonicalName(i.name) === target);
  if (!added) throw new Error('The adapted recipe did not use your confirmed replacement.');
  const old = adaptation.original.ingredients.find(i => i.id === adaptation.ingredientId);
  if (r.ingredients.some(i => canonicalName(i.name) === canonicalName(old.name))) throw new Error('The adapted recipe retained the removed ingredient.');
  const method = r.steps.map(s => s.text.replace(/\{ingredient:[^}]+\}/g, '')).join(' ').toLowerCase().split(adaptation.replacement.name.toLowerCase()).join('');
  if (canonicalName(method).includes(canonicalName(old.name))) throw new Error('The adapted method still uses the removed ingredient.');
  if (r.steps.map(s => s.text).join('\n') === adaptation.original.steps.map(s => s.text).join('\n') && added.quantity === old.quantity && added.unit === old.unit) throw new Error('The kitchen did not adapt the quantities or method. Please try again.');
  return recipes;
}
