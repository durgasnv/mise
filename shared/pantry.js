import { RESTRICTIONS } from "./recipe-safety.js";
export const EQUIPMENT = ['stovetop', 'skillet', 'pot', 'oven', 'microwave', 'air fryer', 'blender', 'grill'];
export const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'count', 'pack'];
export function canonicalName(name) {
  return name.toLowerCase().normalize('NFKC').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ').map(w => ({ potatoes: 'potato', tomatoes: 'tomato', eggs: 'egg', mushrooms: 'mushroom', thighs: 'thigh', cloves: 'clove', noodles: 'noodle' }[w] || w)).join(' ');
}
export const DEFAULT_CONSTRAINTS = { pantry: [], staples: [], servings: 2, maxMinutes: 60, equipment: [...EQUIPMENT], strictPantry: false, restrictions: [], excludedIngredients: [] };
export function validateConstraints(raw = DEFAULT_CONSTRAINTS) {
  const c = structuredClone(raw);
  const fail = () => { throw new Error('Check your pantry, portions, time, equipment and dietary selections.'); };
  if (!c || typeof c !== 'object' || Array.isArray(c)) fail();
  if (!Number.isInteger(c.servings) || c.servings < 1 || c.servings > 12 || !Number.isInteger(c.maxMinutes) || c.maxMinutes < 5 || c.maxMinutes > 1440 || typeof c.strictPantry !== 'boolean') fail();
  for (const [key, max] of [['pantry', 40], ['staples', 12], ['equipment', 8], ['restrictions', 20], ['excludedIngredients', 20]]) {
    if (!Array.isArray(c[key]) || c[key].length > max) fail();
  }
  const names = new Set();
  for (const item of c.pantry) {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120 ||
        (item.quantity !== null && (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 100000)) || !UNITS.includes(item.unit)) fail();
    const name = canonicalName(item.name);
    if (names.has(name)) fail();
    names.add(name);
  }
  for (const key of ['staples', 'restrictions', 'excludedIngredients']) {
    if (c[key].some(x => typeof x !== 'string' || !x.trim() || x.length > 120)) fail();
  }
  if (c.restrictions.some(r => !RESTRICTIONS.includes(r))) fail();
  if (!c.equipment.length || c.equipment.some(e => !EQUIPMENT.includes(e))) fail();
  return c;
}
const factors = { g: ['mass', 1], kg: ['mass', 1000], ml: ['volume', 1], l: ['volume', 1000], tsp: ['volume', 5], tbsp: ['volume', 15], cup: ['volume', 240], count: ['count', 1], pack: ['pack', 1] };
function comparable(quantity, unit, otherUnit) {
  const from = factors[unit.toLowerCase()], to = factors[otherUnit.toLowerCase()];
  return from && to && from[0] === to[0] ? quantity * from[1] / to[1] : null;
}
export function reviewPantry(r, c) {
  const missing = [], quantityChecks = [];
  if (r.servings !== c.servings) throw new Error('The recipe does not match your portions.');
  if (r.prepMinutes + r.cookMinutes > c.maxMinutes) throw new Error('The recipe exceeds your available time.');
  if (r.equipment.some(e => !c.equipment.includes(e))) throw new Error('The recipe needs equipment you did not select.');
  const totals = new Map();
  for (const i of r.ingredients) {
    const name = canonicalName(i.name);
    const entry = c.pantry.find(p => canonicalName(p.name) === name);
    if (!entry && !c.staples.some(s => canonicalName(s) === name) && name !== 'water') { missing.push(`${i.name}: not in your confirmed pantry`); continue; }
    if (!entry || entry.quantity === null) { quantityChecks.push(`Confirm enough ${i.name} for ${i.quantityMax ?? i.quantity} ${i.unit}.`); continue; }
    const need = comparable(i.quantityMax ?? i.quantity, i.unit, entry.unit);
    if (need === null) quantityChecks.push(`Check ${i.name}: ${i.unit} cannot be compared with ${entry.unit}.`);
    else {
      const total = (totals.get(name) || 0) + need; totals.set(name, total);
      if (total > entry.quantity) missing.push(`${i.name}: needs ${Number(total.toFixed(3))} ${entry.unit}; you have ${entry.quantity} ${entry.unit}`);
    }
  }
  if (c.strictPantry && missing.length) throw new Error(`The recipe exceeds your pantry: ${missing.join('; ')}. Try again with adjusted quantities.`);
  return { missing, quantityChecks };
}
