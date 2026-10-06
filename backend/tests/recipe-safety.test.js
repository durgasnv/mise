import test from 'node:test';
import assert from 'node:assert/strict';
import { ingredientConflict, reviewSafety } from '../../shared/recipe-safety.js';
import { DEFAULT_CONSTRAINTS } from '../../shared/pantry.js';
import { dinner } from '../../shared/recipe-fixture.js';
test('screens animal foods, allergens and explicit exclusions independently of model tags', () => {
  for (const [food, restriction] of [['chicken stock', 'vegetarian'], ['gelatin', 'vegan'], ['whey', 'milk-free'], ['tofu', 'soy-free'], ['tahini', 'sesame-free'], ['gochujang with wheat', 'gluten-free'], ['cashew cream', 'tree-nut-free'], ['shrimp', 'shellfish-free'], ['mayonnaise', 'egg-free']]) assert.ok(ingredientConflict(food, [restriction]));
  assert.equal(ingredientConflict('coconut milk', ['vegan', 'milk-free']), null);
  assert.equal(ingredientConflict('peanut butter', ['milk-free']), null);
  assert.ok(ingredientConflict('chili flakes', [], ['chili']));
});
test('uncertain labels require confirmation and safety endpoints enter the rendered method', () => {
  const r = structuredClone(dinner); r.ingredients[0].name = 'chicken';
  const review = reviewSafety(r, { ...DEFAULT_CONSTRAINTS, restrictions: ['gluten-free'] });
  assert.ok(review.labelChecks.length);
  assert.ok(review.safetyNotes.some(n => /165°F/.test(n)));
  for (const text of ['Rinse raw chicken under water.', 'Thaw chicken on the counter.', 'Cook until internally 60°C.', 'Serve raw chicken.']) {
    r.steps[0].text = text; assert.throws(() => reviewSafety(r, DEFAULT_CONSTRAINTS));
  }
});
test('screens saved religious and pescatarian preferences without treating names as certification', () => {
  assert.ok(ingredientConflict('chicken', ['pescatarian']));
  assert.ok(ingredientConflict('pork', ['halal']));
  assert.ok(ingredientConflict('shrimp', ['kosher']));
  assert.equal(ingredientConflict('oyster mushrooms', ['vegetarian']), null);
  const r = structuredClone(dinner);
  r.ingredients[0].name = 'chicken';
  assert.ok(reviewSafety(r, { ...DEFAULT_CONSTRAINTS, restrictions: ['halal'] }).labelChecks.some(note => /certification/.test(note)));
  r.steps[0].text = 'Add butter while cooking.';
  assert.throws(() => reviewSafety(r, { ...DEFAULT_CONSTRAINTS, restrictions: ['milk-free'] }), /method/);
});
test('resolves ingredient references before checking unsafe handling', () => {
  const r = structuredClone(dinner); r.ingredients[0].name = 'chicken';
  r.steps[0].text = 'Serve raw {ingredient:potato}.';
  assert.throws(() => reviewSafety(r, DEFAULT_CONSTRAINTS), /unsafe/);
  r.steps[0].text = 'Rinse {ingredient:potato} under the tap.';
  assert.throws(() => reviewSafety(r, DEFAULT_CONSTRAINTS), /unsafe/);
  r.steps[0].text = 'Cook {ingredient:potato} to an internal temperature of 60 degrees C.';
  assert.throws(() => reviewSafety(r, DEFAULT_CONSTRAINTS), /insufficient/);
});
