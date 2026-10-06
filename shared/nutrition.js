export const NUTRIENTS = { energyKcal: [1008,2047,2048], proteinG: [1003], carbohydrateG: [1005], fatG: [1004], fiberG: [1079] };
export function normalizeFood(food) {
  if (!Number.isSafeInteger(food?.fdcId) || !['Foundation', 'SR Legacy'].includes(food.dataType) || typeof food.description !== 'string' || !Array.isArray(food.foodNutrients)) throw new Error('Choose a supported USDA Foundation or SR Legacy food.');
  const per100g = {};
  for (const [key, ids] of Object.entries(NUTRIENTS)) {
    const nutrient = ids.map(id => food.foodNutrients.find(n => n.nutrient?.id === id && n.nutrient?.unitName?.toLowerCase() === (key === 'energyKcal' ? 'kcal' : 'g'))).find(Boolean);
    per100g[key] = Number.isFinite(nutrient?.amount) && nutrient.amount >= 0 ? nutrient.amount : null;
  }
  return { fdcId: food.fdcId, description: food.description, dataType: food.dataType, publishedOn: food.publicationDate || null,
    sourceUrl: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients`, per100g, retrievedAt: new Date().toISOString() };
}
export function calculateNutrition(recipe, matches) {
  if (!Array.isArray(matches) || matches.length > recipe.ingredients.length || new Set(matches.map(m => m.ingredientId)).size !== matches.length) throw new Error('Confirm one food match and weight per ingredient.');
  for (const m of matches) {
    if (!recipe.ingredients.some(i => i.id === m.ingredientId) || !Number.isFinite(m.grams) || m.grams <= 0 || m.grams > 100000 || !Number.isSafeInteger(m.food?.fdcId)) throw new Error('Confirm each ingredient weight in grams.');
    for (const key of Object.keys(NUTRIENTS)) if (m.food.per100g[key] !== null && (!Number.isFinite(m.food.per100g[key]) || m.food.per100g[key] < 0)) throw new Error('Invalid nutrient data.');
  }
  const missingIngredients = recipe.ingredients.filter(i => !matches.some(m => m.ingredientId === i.id)).map(i => i.name);
  const totals = {}, perServing = {};
  for (const key of Object.keys(NUTRIENTS)) {
    const complete = !missingIngredients.length && matches.every(m => m.food.per100g[key] !== null);
    const known = matches.reduce((sum,m) => sum + (m.food.per100g[key] ?? 0) * m.grams / 100, 0);
    totals[key] = { amount: Number(known.toFixed(2)), complete };
    perServing[key] = { amount: Number((known / recipe.servings).toFixed(2)), complete };
  }
  return { source: 'USDA FoodData Central', matches, missingIngredients, totals, perServing,
    recipeFingerprint: JSON.stringify(recipe), calculatedAt: new Date().toISOString() };
}
export function scaleNutrition(nutrition, original, scaled) {
  if (!nutrition || nutrition.recipeFingerprint !== JSON.stringify(original)) return undefined;
  const factor = scaled.servings / original.servings;
  return calculateNutrition(scaled, nutrition.matches.map(m => ({ ...m, grams: m.grams * factor })));
}

export function validateNutrition(nutrition, recipe) {
  if (!nutrition || nutrition.source !== 'USDA FoodData Central' || nutrition.recipeFingerprint !== JSON.stringify(recipe)) throw new Error('Nutrition does not match this recipe revision.');
  for (const match of nutrition.matches || []) {
    const food = match.food;
    if (!food || !['Foundation','SR Legacy'].includes(food.dataType) || typeof food.description !== 'string' || food.sourceUrl !== `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients` || !Number.isFinite(Date.parse(food.retrievedAt))) throw new Error('Invalid nutrition source.');
  }
  const calculated = calculateNutrition(recipe, nutrition.matches);
  if (JSON.stringify(calculated.totals) !== JSON.stringify(nutrition.totals) || JSON.stringify(calculated.perServing) !== JSON.stringify(nutrition.perServing)) throw new Error('Nutrition totals do not match ingredient data.');
  return nutrition;
}
