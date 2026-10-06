import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleStructuredRecipe, scaledRecipeView } from '../../shared/recipe-scaling.js';
import { recipeView } from '../../shared/recipes.js';
import { dinner } from '../../shared/recipe-fixture.js';
import { DEFAULT_CONSTRAINTS } from '../../shared/pantry.js';
test('scales fractions and ranges while preserving package size, timing, temperature and original data', () => {
  const r = structuredClone(dinner);
  Object.assign(r.ingredients[0], { quantity: 0.25, quantityMax: 0.5, unit: 'pack', packageSize: '400 g' });
  r.steps[0].text = 'Roast {ingredient:potato} at 200°C for 15 minutes.';
  const base = recipeView(r);
  const scaled = scaledRecipeView(base, 4);
  assert.equal(scaled.ingredients[0], '0.5–1 pack potato (400 g package size), diced');
  assert.match(scaled.instructions[0], /200°C for 15 minutes/);
  assert.match(scaled.instructions[0], /0.5–1 pack/);
  assert.equal(r.ingredients[0].quantity, 0.25);
  assert.throws(() => scaleStructuredRecipe(r, 0));
});
test('rechecks pantry after scaling and leaves legacy text intact', () => {
  const base = recipeView(dinner, { constraints: { ...DEFAULT_CONSTRAINTS, pantry: [{ name: 'potato', quantity: 500, unit: 'g' }], strictPantry: true } });
  assert.equal(scaledRecipeView(base, 4).review.missing.length, 1);
  const old = { ingredients: ['1 1/2 packs (400 g each)'], instructions: ['Cook at 200°C for 15 minutes.'] };
  assert.equal(scaledRecipeView(old, 4), old);
});
test('full export preserves every scaled amount, method step and label check', async () => {
  const { recipeText } = await import('../../shared/recipe-export.js');
  const view = scaledRecipeView(recipeView(dinner, { review: { labelChecks: ['Check product labels'], safetyNotes: ['Use a thermometer.'] } }), 4);
  const text = recipeText(view);
  assert.match(text, /800 g potato/); assert.match(text, /15 minutes/);
  assert.match(text, /Check product labels/); assert.match(text, /Use a thermometer/);
});
