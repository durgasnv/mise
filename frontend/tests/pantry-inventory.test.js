import test from 'node:test';
import assert from 'node:assert/strict';
import { savePantryItem, getPantry, deductPantry, deductionPreview, expiryStatus } from '../src/lib/pantryInventory.js';
import { recipeView } from '../../shared/recipes.js';
import { dinner } from '../../shared/recipe-fixture.js';
function browser(run) {
  const previous = { localStorage: globalThis.localStorage, window: globalThis.window }, data = new Map();
  globalThis.localStorage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) };
  globalThis.window = { dispatchEvent() {} };
  const login = id => data.set('mise_active_chef_user_v3', JSON.stringify({ id, provider: 'puter' }));
  try { run(login); } finally { Object.assign(globalThis, previous); }
}
test('persists pantry per account and rejects invalid amounts/dates', () => browser(login => {
  login('a'); savePantryItem({ name: 'potato', quantity: 0.5, unit: 'kg', expiresOn: '2026-10-08' });
  assert.equal(getPantry().items.length, 1); login('b'); assert.equal(getPantry().items.length, 0);
  assert.throws(() => savePantryItem({ name: 'potato', quantity: -1, unit: 'g' }));
  assert.throws(() => savePantryItem({ name: 'potato', quantity: 1, unit: 'g', expiresOn: '2026-02-30' }));
  assert.match(expiryStatus('2026-10-08', '2026-10-06'), /2 days/);
}));
test('deducts confirmed use once, aggregates units and preserves inventory on failure', () => browser(login => {
  login('a'); savePantryItem({ name: 'potato', quantity: 0.5, unit: 'kg' });
  const [row] = deductionPreview(recipeView(dinner)); assert.equal(row.used, 0.4);
  deductPantry('meal', [{ id: row.id, used: row.used }]);
  assert.equal(getPantry().items[0].quantity, 0.1);
  assert.equal(deductPantry('meal', [{ id: row.id, used: row.used }]).alreadyApplied, true);
  assert.throws(() => deductPantry('other', [{ id: row.id, used: 1 }])); assert.equal(getPantry().items[0].quantity, 0.1);
  login('b'); assert.throws(() => savePantryItem({ name: 'x', quantity: 1, unit: 'g' }, 'puter:a'));
}));
