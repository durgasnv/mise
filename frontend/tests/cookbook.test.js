import test from 'node:test';
import assert from 'node:assert/strict';
import { saveRecipe, getSavedRecipes, deleteRecipe, readCookbook, cookbookOwner, mergeCookbooks, recipesFromBook, importLegacyCookbook, legacyRecipesAvailable } from '../src/lib/savedRecipes.js';
import { syncCookbook } from '../src/lib/cookbookSync.js';
import { recipeView } from '../../shared/recipes.js';
import { dinner } from '../../shared/recipe-fixture.js';
const profileKey = 'mise_active_chef_user_v3';
async function browser(run) {
  const previous = { window: globalThis.window, localStorage: globalThis.localStorage, CustomEvent: globalThis.CustomEvent };
  const store = new Map(), cloud = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  const login = id => { store.set(profileKey, JSON.stringify({ provider: 'puter', id })); window.puter.authToken = `token-${id}`; };
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
  globalThis.window = { dispatchEvent() {}, puter: { authToken: '', auth: { getUser: async () => ({ uuid: JSON.parse(store.get(profileKey)).id }) }, kv: {
    list: async ({ pattern }) => [...cloud].filter(([key]) => key.startsWith(pattern)).map(([key, value]) => ({ key, value })),
    get: async key => cloud.get(key) ?? null, set: async (key, value) => { cloud.set(key, value); },
  } } };
  try { await run({ store, cloud, login }); } finally { Object.assign(globalThis, previous); }
}
const recipe = id => recipeView(dinner, { id });
test('isolates accounts and demo recipes; legacy collection requires explicit ownership import', async () => browser(async ({ store, login }) => {
  store.set('mise_saved_recipes_v2', JSON.stringify([recipe('legacy')]));
  login('A'); assert.deepEqual(getSavedRecipes(), []);
  saveRecipe(recipe('a')); login('B'); assert.deepEqual(getSavedRecipes(), []);
  assert.equal(legacyRecipesAvailable(), true); importLegacyCookbook();
  assert.deepEqual(getSavedRecipes().map(r => r.id), ['legacy']);
  assert.ok(store.has('mise_saved_recipes_v2')); login('A'); assert.equal(legacyRecipesAvailable(), false);
  assert.deepEqual(getSavedRecipes().map(r => r.id), ['a']);
}));
test('merge retains different recipes and tombstones; undo is a later save', async () => browser(async ({ login }) => {
  login('A'); saveRecipe(recipe('a')); const before = readCookbook();
  const deleted = deleteRecipe('a'); assert.deepEqual(getSavedRecipes(), []);
  assert.deepEqual(recipesFromBook(mergeCookbooks(before, readCookbook())), []);
  saveRecipe(deleted.deleted); assert.equal(getSavedRecipes().length, 1);
  saveRecipe(recipe('b')); assert.equal(getSavedRecipes().length, 2);
}));
test('cloud merges immutable operations without overwriting legacy or reviving deleted recipes', async () => browser(async ({ cloud, login }) => {
  login('A'); const legacy = JSON.stringify([recipe('legacy')]); cloud.set('mise_cloud_cookbook', legacy);
  saveRecipe(recipe('a')); await syncCookbook(); assert.equal(getSavedRecipes().length, 2);
  deleteRecipe('legacy'); await syncCookbook(); await syncCookbook();
  assert.deepEqual(getSavedRecipes().map(r => r.id), ['a']); assert.equal(cloud.get('mise_cloud_cookbook'), legacy);
  login('B'); cloud.delete('mise_cloud_cookbook'); await syncCookbook(); assert.deepEqual(getSavedRecipes(), []);
}));
test('account switching in flight cancels writes; offline failures keep local saves', async () => browser(async ({ cloud, login }) => {
  login('A'); saveRecipe(recipe('a'));
  window.puter.kv.list = async () => { login('B'); return []; };
  await assert.rejects(syncCookbook(), /Account changed/); assert.equal(cloud.size, 0);
  login('A'); assert.equal(getSavedRecipes()[0].id, 'a');
  window.puter.kv.list = async () => { throw new Error('offline'); };
  await assert.rejects(syncCookbook(), /offline/); assert.equal(getSavedRecipes()[0].id, 'a');
}));
test('mismatched SDK identity never syncs, and corrupt local data is preserved', async () => browser(async ({ store, cloud, login }) => {
  login('A'); window.puter.auth.getUser = async () => ({ uuid: 'B' });
  await assert.rejects(syncCookbook(), /Sign in again/); assert.equal(cloud.size, 0);
  const key = `mise_cookbook_v3:${encodeURIComponent(cookbookOwner())}`; store.set(key, 'broken');
  assert.throws(() => getSavedRecipes()); assert.throws(() => saveRecipe(recipe('a'))); assert.equal(store.get(key), 'broken');
}));
