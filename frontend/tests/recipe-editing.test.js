import test from 'node:test';
import assert from 'node:assert/strict';
import { editRecipe, validateLegacyRecipe } from '../../shared/recipe-editing.js';
import { recipeView } from '../../shared/recipes.js';
import { dinner } from '../../shared/recipe-fixture.js';
import { DEFAULT_CONSTRAINTS } from '../../shared/pantry.js';
test('edits retain identity, create a revision and revalidate quantities and dietary rules', () => {
  const original = recipeView(dinner, { id: 'saved' });
  const modified = structuredClone(dinner); modified.title = 'New potato dinner';
  const edited = editRecipe(original, modified, DEFAULT_CONSTRAINTS);
  assert.equal(edited.id, 'saved'); assert.equal(edited.revision, 2); assert.equal(original.title, dinner.title);
  modified.ingredients[0].quantity = -1; assert.throws(() => editRecipe(original, modified, DEFAULT_CONSTRAINTS));
  modified.ingredients[0].quantity = 100; modified.ingredients[0].name = 'butter';
  assert.throws(() => editRecipe(original, modified, { ...DEFAULT_CONSTRAINTS, restrictions: ['vegan'] }));
});
test('legacy conversion accepts only bounded original content and removes extra fields', () => {
  const value = validateLegacyRecipe({ title: 'Old dinner', ingredients: ['400g potato'], instructions: ['Cook it.'], private: 'not forwarded' });
  assert.equal('private' in value, false); assert.throws(() => validateLegacyRecipe({ title: 'Empty' }));
});
