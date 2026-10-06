import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

test('renders pantry constraints, a recommended dinner, scaled recipe and account cookbook without runtime errors', async () => {
  const compiled = await build({
    stdin: { contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import assert from 'node:assert/strict';
      import { HomePage } from './src/pages/HomePage.jsx';
      import { RecipeCard } from './src/components/RecipeCard.jsx';
      import { MultiRecipeStack } from './src/components/MultiRecipeStack.jsx';
      import { SavedPage } from './src/pages/SavedPage.jsx';
      import { CookingModeModal } from './src/components/CookingModeModal.jsx';
      import { recipeView } from '../shared/recipes.js';
      import { DEFAULT_CONSTRAINTS } from '../shared/pantry.js';
      import { dinner } from '../shared/recipe-fixture.js';
      globalThis.localStorage = { getItem: key => key === 'mise_active_chef_user_v3' ? JSON.stringify({ id: 'chef', provider: 'puter', dietaryPreferences: ['Vegan'] }) : null };
      globalThis.window = { puter: { authToken: 'test' } };
      const r = recipeView(dinner, { constraints: { ...DEFAULT_CONSTRAINTS, pantry: [{ name: 'potato', quantity: 500, unit: 'g' }] }, review: { missing: [], quantityChecks: [], labelChecks: [] } });
      const form = renderToStaticMarkup(<HomePage />);
      assert.match(form, /Your household &amp; pantry/);
      assert.match(form, /Recommend dinner/);
      const card = renderToStaticMarkup(<RecipeCard recipe={r} />);
      assert.match(card, /400 g potato/);
      assert.match(card, /Open cooking mode/);
      const deck = renderToStaticMarkup(<MultiRecipeStack recipes={[r, { ...r, id: 'other' }]} />);
      assert.match(deck, /Recommended dinner/);
      assert.match(deck, /Explore 1 alternative/);
      assert.doesNotMatch(deck, /Return to recommended/);
      assert.match(renderToStaticMarkup(<SavedPage />), /Saved on this device/);
      assert.match(renderToStaticMarkup(<CookingModeModal recipe={r} />), /I cooked this meal/);
      console.log('Rendering workflow passed');
    `, loader: 'jsx', resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
    define: { 'import.meta.env': '{}' }, logLevel: 'silent',
  });
  let completed = false;
  runInNewContext(compiled.outputFiles[0].text, {
    require: createRequire(import.meta.url), process, Buffer, TextEncoder, TextDecoder,
    setTimeout, clearTimeout, setImmediate, clearImmediate,
    console: { log: message => { completed = message === 'Rendering workflow passed'; }, error() {}, warn() {} },
  });
  assert.equal(completed, true);
});
