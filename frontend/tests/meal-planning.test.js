import test from 'node:test';
import assert from 'node:assert/strict';
import { shoppingList, shoppingText } from '../../shared/meal-planning.js';
import { recipeView } from '../../shared/recipes.js';
import { dinner } from '../../shared/recipe-fixture.js';
test('combines scaled demand, subtracts pantry once, and handles quantity ranges', () => {
  const recipe = recipeView(dinner), entries = [{ recipe, servings: 4 }, { recipe, servings: 2 }];
  const [line] = shoppingList(entries, [{ name: 'potatoes', quantity: 1, unit: 'kg' }]);
  assert.equal(line.needed, 1200); assert.equal(line.shortfall, 200);
  assert.match(shoppingText([line]), /200 g missing/);
  const ranged = recipeView({ ...dinner, ingredients: [{ ...dinner.ingredients[0], quantityMax: 500 }] });
  assert.equal(shoppingList([{ recipe: ranged, servings: 2 }], [])[0].needed, 500);
});
test('unknown amounts and incompatible units remain visible instead of guessing conversions', () => {
  const [line] = shoppingList([{ recipe: recipeView(dinner), servings: 2 }], [{ name: 'potato', quantity: 4, unit: 'count' }]);
  assert.equal(line.shortfall, null); assert.match(line.check, /incompatible/);
});
