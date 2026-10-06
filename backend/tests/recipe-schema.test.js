import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecipes, recipeView } from '../../shared/recipes.js';
import { dinner, recipeJSON } from '../../shared/recipe-fixture.js';

test('valid JSON renders numeric ingredients and referenced instructions', () => {
  const [recipe] = validateRecipes(recipeJSON);
  const view = recipeView(recipe);
  assert.equal(view.ingredients[0], '400 g potato, diced');
  assert.match(view.instructions[0], /400 g potato/);
});
test('rejects Markdown, partial data, duplicate IDs, unknown references and hidden quantities', () => {
  assert.throws(() => validateRecipes('# A recipe'));
  for (const mutate of [r => delete r.title, r => r.ingredients.push(r.ingredients[0]),
    r => r.steps[0].text = 'Use {ingredient:unknown}', r => r.ingredients[0].quantity = -1,
    r => r.steps[0].text = 'Add 2 tbsp oil', r => r.steps[0].ingredientIds = [], r => r.calories = 500]) {
    const r = structuredClone(dinner); mutate(r);
    assert.throws(() => validateRecipes({ recipes: [r] }));
  }
});
test('rejects undeclared fields even when they shadow Object prototype properties', () => {
  for (const key of ['constructor', '__proto__', 'toString']) {
    const r = structuredClone(dinner);
    Object.defineProperty(r, key, { value: {}, enumerable: true });
    assert.throws(() => validateRecipes({ recipes: [r] }), /Unexpected field/);
  }
});
