import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONSTRAINTS, validateConstraints, reviewPantry } from '../../shared/pantry.js';
import { dinner } from '../../shared/recipe-fixture.js';
const constraints = (patch = {}) => ({ ...DEFAULT_CONSTRAINTS, pantry: [{ name: 'potatoes', quantity: 0.5, unit: 'kg' }], strictPantry: true, ...patch });
test('compares compatible quantities, checks total demand, and preserves missing visibility', () => {
  assert.deepEqual(reviewPantry(dinner, constraints()), { missing: [], quantityChecks: [] });
  const r = structuredClone(dinner); r.ingredients.push({ ...r.ingredients[0], id: 'second' });
  assert.throws(() => reviewPantry(r, constraints()), /needs 0.8 kg/);
  assert.throws(() => reviewPantry(dinner, constraints({ pantry: [] })), /confirmed pantry/);
  assert.equal(reviewPantry(dinner, constraints({ strictPantry: false, pantry: [] })).missing.length, 1);
});
test('unknown amounts and incompatible units require confirmation; constraints cannot be bypassed', () => {
  assert.equal(reviewPantry(dinner, constraints({ pantry: [{ name: 'potato', quantity: 2, unit: 'count' }] })).quantityChecks.length, 1);
  for (const patch of [{ servings: 4 }, { maxMinutes: 10 }, { equipment: ['oven'] }]) assert.throws(() => reviewPantry(dinner, constraints(patch)));
  for (const patch of [{ servings: 0 }, { equipment: ['invented'] }, { pantry: [{ name: 'x', quantity: -1, unit: 'g' }] }, { strictPantry: 'yes' }]) assert.throws(() => validateConstraints(constraints(patch)));
});
