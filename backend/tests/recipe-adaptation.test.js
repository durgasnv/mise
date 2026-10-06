import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAdaptation, validateAdaptedRecipes } from '../../shared/recipe-adaptation.js';
import { reviewPantry, DEFAULT_CONSTRAINTS } from '../../shared/pantry.js';
import { reviewSafety } from '../../shared/recipe-safety.js';
import { dinner } from '../../shared/recipe-fixture.js';
const replacement = { name: 'sweet potato', quantity: 500, unit: 'g' };
test('builds a confirmed replacement pantry and rejects dietary conflicts before generation', () => {
  const a = prepareAdaptation(dinner, 'potato', replacement, DEFAULT_CONSTRAINTS);
  assert.deepEqual(a.constraints.pantry, [replacement]);
  assert.equal(a.constraints.pantry.some(i => i.name === 'potato'), false);
  assert.throws(() => prepareAdaptation(dinner, 'potato', { name: 'butter', quantity: 20, unit: 'g' }, { ...DEFAULT_CONSTRAINTS, restrictions: ['vegan'] }));
  assert.throws(() => prepareAdaptation(dinner, 'missing', replacement, DEFAULT_CONSTRAINTS));
});
test('rejects label-only changes and revalidates amount, method and safety', () => {
  const a = prepareAdaptation(dinner, 'potato', { name: 'carrot', quantity: 500, unit: 'g' }, { ...DEFAULT_CONSTRAINTS, strictPantry: true });
  const r = structuredClone(dinner); r.ingredients[0].name = 'carrot';
  assert.throws(() => validateAdaptedRecipes([r], a), /did not adapt/);
  r.ingredients[0].quantity = 350; r.steps[0].text = 'Steam {ingredient:potato} for 12 minutes until tender.';
  validateAdaptedRecipes([r], a); reviewPantry(r, a.constraints); reviewSafety(r, a.constraints);
  r.ingredients[0].quantity = 600;
  assert.throws(() => reviewPantry(r, a.constraints), /exceeds your pantry/);
});
