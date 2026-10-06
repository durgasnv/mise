import { canonicalName, comparable } from './pantry.js';
import { scaleStructuredRecipe } from './recipe-scaling.js';
export function shoppingList(entries, pantry) {
  const demand = new Map();
  for (const entry of entries) {
    const recipe = scaleStructuredRecipe(entry.recipe.structured, entry.servings);
    for (const i of recipe.ingredients) {
      const unit = ['g', 'kg'].includes(i.unit) ? 'g' : ['ml','l','tsp','tbsp','cup'].includes(i.unit) ? 'ml' : i.unit;
      const key = `${canonicalName(i.name)}:${unit}`;
      const line = demand.get(key) || { name: i.name, unit, needed: 0 };
      line.needed += comparable(i.quantityMax ?? i.quantity, i.unit, unit); demand.set(key, line);
    }
  }
  return [...demand.values()].map(line => {
    const entry = pantry.find(i => canonicalName(i.name) === canonicalName(line.name));
    const available = entry && entry.quantity !== null ? comparable(entry.quantity, entry.unit, line.unit) : null;
    return { ...line, needed: Number(line.needed.toFixed(6)), available, shortfall: available === null ? null : Number(Math.max(0, line.needed - available).toFixed(6)),
      check: !entry ? 'Not in pantry: buy or confirm availability' : available === null ? 'Check available quantity or incompatible units' : '' };
  });
}
export function shoppingText(lines) {
  return lines.filter(l => l.shortfall !== 0).map(l => `${l.name}: ${l.shortfall === null ? `${l.needed} ${l.unit} total needed — ${l.check}` : `${l.shortfall} ${l.unit} missing`}`).join('\n') || 'Your recorded pantry covers this plan.';
}
export function weekStartDate(date = new Date().toISOString().slice(0,10)) {
  const day = new Date(`${date}T00:00:00Z`); day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0,10);
}
export function weekEntries(entries, start) {
  const end = new Date(`${start}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + 7);
  return entries.filter(e => e.date >= start && e.date < end.toISOString().slice(0,10));
}
