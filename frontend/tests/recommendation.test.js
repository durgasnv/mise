import test from 'node:test';
import assert from 'node:assert/strict';
import { rankRecipes, recommendationReason } from '../../shared/recipe-ranking.js';
import { recipeView } from '../../shared/recipes.js';
import { dinner } from '../../shared/recipe-fixture.js';
import { mealSummary } from '../src/lib/mealActivity.js';
test('prioritizes actual pantry fit, checks and then total time', () => {
  const a = recipeView(dinner, { id: 'a', review: { missing: ['potato'] } });
  const b = recipeView({ ...dinner, cookMinutes: 25 }, { id: 'b', review: { missing: [] } });
  const c = recipeView(dinner, { id: 'c', review: { missing: [] } });
  assert.deepEqual(rankRecipes([a,b,c]).map(r => r.id), ['c','b','a']);
  assert.match(recommendationReason(c), /20 minutes for 2 servings/);
});
test('measures reported completions and repeat days without treating starts as completed meals', () => {
  const now = Date.parse('2026-10-06T12:00:00Z');
  const events = [
    { type: 'cookingStarted', at: '2026-10-06T10:00:00Z' },
    { type: 'mealCompleted', at: '2026-10-06T11:00:00Z', rating: 4, neededShopping: false },
    { type: 'mealCompleted', at: '2026-10-05T11:00:00Z', rating: 2, neededShopping: true },
    { type: 'mealCompleted', at: '2026-08-01T11:00:00Z' },
  ];
  assert.deepEqual(mealSummary(events, now), { completedMeals: 2, cookingDays: 2, repeatCookingDays: 1, cookingStarts: 1, averageRating: 3, noShoppingMeals: 1 });
});
