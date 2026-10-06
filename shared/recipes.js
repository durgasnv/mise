import { EQUIPMENT, UNITS } from "./pantry.js";
// The provider contract is shared by the server validator and browser renderer.
const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const text = { type: 'string' };
const number = { type: 'number' };
export const RECIPE_SCHEMA = object({ recipes: { type: 'array', items: object({
  title: text, servings: number, prepMinutes: number, cookMinutes: number,
  equipment: { type: 'array', items: { ...text, enum: EQUIPMENT } },
  ingredients: { type: 'array', items: object({
    id: text, name: text, quantity: number, quantityMax: { type: ['number', 'null'] },
    unit: { ...text, enum: UNITS }, preparation: text, packageSize: text,
  }) },
  steps: { type: 'array', items: object({ text, ingredientIds: { type: 'array', items: text } }) },
  chefNote: text,
}) } });

export function validateRecipes(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { throw new Error('The kitchen returned invalid JSON. Please try again.'); }
  }
  function validate(v, schema, path) {
    if (Array.isArray(schema.type)) {
      if (v === null && schema.type.includes('null')) return;
      return validate(v, { ...schema, type: schema.type[0] }, path);
    }
    if (schema.type === 'object') {
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`Invalid ${path}.`);
      if (Object.keys(v).some(k => !Object.hasOwn(schema.properties, k))) throw new Error(`Unexpected field in ${path}.`);
      for (const k of schema.required) validate(v[k], schema.properties[k], `${path}.${k}`);
    } else if (schema.type === 'array') {
      if (!Array.isArray(v) || v.length > 40) throw new Error(`Invalid ${path}.`);
      v.forEach((item, i) => validate(item, schema.items, `${path}[${i}]`));
    } else if (schema.type === 'string') {
      if (typeof v !== 'string' || v.length > 2000 || (schema.enum && !schema.enum.includes(v))) throw new Error(`Invalid ${path}.`);
    } else if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100000) throw new Error(`Invalid ${path}.`);
  }
  validate(value, RECIPE_SCHEMA, 'recipes');
  if (JSON.stringify(value).length > 90000) throw new Error('The recipe response is too large.');
  if (!value.recipes.length || value.recipes.length > 3) throw new Error('Expected one to three complete recipes.');
  for (const r of value.recipes) {
    if (JSON.stringify(r).length > 30000) throw new Error('The recipe is too large.');
    if (!r.title.trim() || !Number.isInteger(r.servings) || r.servings < 1 || r.servings > 12 ||
        !r.ingredients.length || !r.steps.length || r.prepMinutes + r.cookMinutes < 1 || r.prepMinutes + r.cookMinutes > 1440) throw new Error('The recipe is incomplete.');
    const ids = new Set(r.ingredients.map(i => i.id));
    if (ids.size !== r.ingredients.length) throw new Error('Ingredient IDs must be unique.');
    for (const i of r.ingredients) {
      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(i.id) || !i.name.trim() || i.name.length > 120 || i.quantity <= 0 ||
          (i.quantityMax !== null && i.quantityMax < i.quantity)) throw new Error('Invalid ingredient quantity or name.');
    }
    const used = new Set();
    for (const step of r.steps) {
      if (!step.text.trim() || step.ingredientIds.some(id => !ids.has(id))) throw new Error('Invalid recipe step.');
      step.ingredientIds.forEach(id => used.add(id));
      for (const match of step.text.matchAll(/\{ingredient:([^}]+)\}/g)) {
        if (!ids.has(match[1]) || !step.ingredientIds.includes(match[1])) throw new Error('Unknown ingredient reference.');
      }
      // Quantities belong in ingredient placeholders, never free numeric text in a method.
      if (/\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|cups?|tbsp|tsp|tablespoons?|teaspoons?|ounces?|oz|pounds?|lb)\b/i.test(step.text)) throw new Error('Method quantities must reference structured ingredients.');
    }
    if (r.ingredients.some(i => !used.has(i.id))) throw new Error('Every ingredient must be used in the method.');
  }
  return value.recipes;
}

export function ingredientText(i, factor = 1) {
  const fmt = n => Number((n * factor).toFixed(3)).toString();
  return `${fmt(i.quantity)}${i.quantityMax === null ? '' : `–${fmt(i.quantityMax)}`} ${i.unit} ${i.name}${i.packageSize ? ` (${i.packageSize} package size)` : ''}${i.preparation ? `, ${i.preparation}` : ''}`.trim();
}
export function recipeView(structured, { id, constraints, review } = {}) {
  return {
    id: id || `recipe-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`,
    version: 1, structured, constraints, review,
    title: structured.title, basePortions: structured.servings, servings: `${structured.servings} portions`,
    prepTime: `${structured.prepMinutes} mins`, cookTime: `${structured.cookMinutes} mins`,
    ingredients: structured.ingredients.map(i => ingredientText(i)),
    instructions: structured.steps.map(step => step.text.replace(/\{ingredient:([^}]+)\}/g, (_, id) => ingredientText(structured.ingredients.find(i => i.id === id)))).concat(review?.safetyNotes || []),
    chefNote: structured.chefNote, tags: [],
  };
}
