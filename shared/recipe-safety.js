// Conservative screening, not allergen certification. Packaged-food labels and
// cross-contact must still be checked by the person cooking.
export const RESTRICTIONS = ['vegan', 'vegetarian', 'gluten-free', 'milk-free', 'egg-free', 'fish-free', 'shellfish-free', 'peanut-free', 'tree-nut-free', 'soy-free', 'sesame-free'];
const animal = /\b(chicken|turkey|duck|poultry|beef|veal|pork|bacon|ham|lamb|mutton|venison|gelatin|lard|tallow|anchov(?:y|ies)|fish|salmon|tuna|cod|trout|sardines?|shrimp|prawns?|crab|lobster|clam|mussel|oyster|scallop|squid|octopus)\b/i;
const rules = {
  'milk-free': /\b(milk|butter|cream|cheese|yog[hu]+rt|ghee|whey|casein|curd|paneer|parmesan)\b/i,
  'egg-free': /\b(eggs?|mayonnaise|mayo|meringue|albumen)\b/i,
  'fish-free': /\b(fish|anchov(?:y|ies)|salmon|tuna|cod|trout|sardines?|bonito|dashi|worcestershire)\b/i,
  'shellfish-free': /\b(shrimp|prawns?|crab|lobster|clam|mussel|oyster|scallop|squid|octopus|shellfish)\b/i,
  'peanut-free': /\b(peanuts?|groundnuts?)\b/i,
  'tree-nut-free': /\b(almonds?|walnuts?|cashews?|pecans?|pistachios?|hazelnuts?|macadamia|brazil nuts?|pine nuts?)\b/i,
  'soy-free': /\b(soy|soya|soybean|tofu|tempeh|edamame|miso|tamari)\b/i,
  'sesame-free': /\b(sesame|tahini)\b/i,
  'gluten-free': /\b(wheat|barley|rye|semolina|farro|spelt|bulgur|couscous|seitan|malt|bread|pasta|ramen|noodles?|flour|soy sauce)\b/i,
};
function adjustedName(name, restriction) {
  let n = name.toLowerCase();
  if (restriction === 'milk-free' || restriction === 'vegan') {
    n = n.replace(/\b(?:coconut|oat|almond|soy|soya|rice)\s+(?:milk|cream)\b/g, 'plant drink').replace(/\bpeanut butter\b/g, 'peanut spread');
  }
  if (restriction === 'gluten-free' && /\bgluten[ -]free\b/.test(n)) return '';
  return n;
}
export function ingredientConflict(name, restrictions, excluded = []) {
  const n = name.normalize('NFKC');
  if (excluded.some(x => n.toLowerCase().includes(x.toLowerCase()))) return `Excluded ingredient: ${name}`;
  for (const restriction of restrictions) {
    const adjusted = adjustedName(n, restriction);
    const conflict = restriction === 'vegetarian' ? animal.test(n)
      : restriction === 'vegan' ? animal.test(n) || rules['milk-free'].test(adjusted) || rules['egg-free'].test(n) || /\bhoney\b/i.test(n)
      : rules[restriction]?.test(adjusted);
    if (conflict) return `${name} conflicts with ${restriction}.`;
  }
  return null;
}
export function reviewSafety(recipe, constraints) {
  if (constraints.restrictions.some(r => !RESTRICTIONS.includes(r))) throw new Error('Choose a supported dietary restriction; use explicit exclusions for other ingredients.');
  for (const i of recipe.ingredients) {
    const conflict = ingredientConflict(i.name, constraints.restrictions, constraints.excludedIngredients);
    if (conflict) throw new Error(conflict);
  }
  const method = recipe.steps.map(s => s.text).join(' ');
  const hiddenConflict = ingredientConflict(method.replace(/\{ingredient:[^}]+\}/g, ''), constraints.restrictions, constraints.excludedIngredients);
  if (hiddenConflict) throw new Error('The method mentions an ingredient that conflicts with your restrictions.');
  if (/\b(?:wash|rinse)\b.{0,25}\b(?:raw )?(?:chicken|poultry|turkey)\b/i.test(method) ||
      /\bthaw\b.{0,50}\b(?:counter|room temperature)\b/i.test(method) ||
      /\b(?:rare|undercooked|raw)\s+(?:chicken|poultry|turkey|pork|ground beef)\b/i.test(method)) throw new Error('The cooking method contains unsafe handling advice. Please regenerate.');
  const checks = [], safetyNotes = [];
  const names = recipe.ingredients.map(i => i.name).join(' ');
  const add = (pattern, note) => { if (pattern.test(names)) safetyNotes.push(note); };
  add(/\b(chicken|turkey|duck|poultry)\b/i, 'Before serving poultry, verify at least 74°C / 165°F internally with a food thermometer. Cooking time or color alone does not establish doneness.');
  add(/\b(?:ground|minced)\s+(?:beef|pork|lamb|veal|meat)\b|\b(?:beef|pork|lamb|veal)\s+(?:mince|ground)\b/i, 'Before serving ground meat, verify at least 71.1°C / 160°F internally with a food thermometer.');
  add(/\b(beef|pork|veal|lamb)\b/i, 'For whole cuts of beef, pork, veal or lamb, verify at least 63°C / 145°F internally and rest for at least 3 minutes; ground meat requires 71.1°C / 160°F.');
  add(/\b(fish|salmon|tuna|cod|trout)\b/i, 'Before serving fish, verify at least 63°C / 145°F internally with a food thermometer.');
  add(/\beggs?\b/i, 'Cook eggs until the yolk and white are firm; egg dishes must reach 71.1°C / 160°F.');
  add(/\b(leftover|cooked chicken|cooked rice)\b/i, 'Reheat leftovers to 74°C / 165°F internally. Refrigerate perishable food within 2 hours (1 hour above 32°C / 90°F).');
  if (animal.test(names)) safetyNotes.push('Keep raw animal foods separate from ready-to-eat food, and clean hands, utensils and surfaces after handling.');
  for (const note of safetyNotes) {
    const minimum = note.match(/at least (\d+(?:\.\d+)?)°C/);
    if (minimum) {
      for (const match of method.matchAll(/(?:internal(?:ly)?|center|centre).{0,20}?(\d+(?:\.\d+)?)\s*°?\s*([CF])\b/gi)) {
        const c = match[2].toUpperCase() === 'F' ? (Number(match[1]) - 32) * 5 / 9 : Number(match[1]);
        // Conservative: a lower internal endpoint is rejected, including ambiguous multi-protein dishes.
        if (c + 0.2 < Number(minimum[1])) throw new Error('The recipe specifies an insufficient internal cooking temperature.');
      }
    }
  }
  if (constraints.restrictions.length || constraints.excludedIngredients.length) {
    checks.push('Check every ingredient label and cross-contact information against your restrictions. The ingredient-name screen cannot certify allergy safety.');
    for (const i of recipe.ingredients) {
      if (/\b(sauce|paste|stock|broth|noodle|bread|pasta|mix|dressing|seasoning|miso|gochujang|pesto|chocolate|sausage|spread|flour)\b/i.test(i.name)) checks.push(`Confirm the full composition of ${i.name}; compound ingredients vary by brand.`);
    }
  }
  return { labelChecks: checks, safetyNotes };
}
