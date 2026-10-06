import { getCurrentUser } from './auth.js';
import { cookbookOwner, readCookbook, writeCookbook, mergeCookbooks, validateCookbookOperations } from './savedRecipes.js';
let queued = Promise.resolve();
export function getSyncStatus() { return syncStatus; }
let syncStatus = 'Saved on this device';
function status(message) { syncStatus = message; window.dispatchEvent(new Event('mise-sync-status')); }
export function syncCookbook() {
  const user = getCurrentUser(), owner = cookbookOwner(), sdk = window.puter, token = sdk?.authToken;
  if (user?.provider !== 'puter' || !token || !sdk?.kv?.list || !sdk?.auth?.getUser) { status('Saved on this device'); return Promise.resolve(); }
  const prefix = `mise_cookbook_v3:${encodeURIComponent(user.id)}:`;
  const assertOwner = () => {
    if (cookbookOwner() !== owner || window.puter !== sdk || sdk.authToken !== token) throw new Error('Account changed during sync.');
  };
  async function verified() {
    assertOwner();
    const identity = await sdk.auth.getUser();
    assertOwner();
    if (identity?.uuid !== user.id || identity.is_temp) throw new Error('Sign in again before syncing this cookbook.');
  }
  const operation = queued.catch(() => {}).then(async () => {
    await verified(); status('Syncing your cookbook…');
    // Immutable per-operation keys avoid replacing a collection during concurrent device writes.
    assertOwner();
    const rows = await sdk.kv.list({ pattern: prefix, returnValues: true });
    assertOwner();
    if (!Array.isArray(rows)) throw new Error('Cloud cookbook is unreadable.');
    const cloudOps = rows.filter(row => row.key?.startsWith(prefix)).map(row => typeof row.value === 'string' ? JSON.parse(row.value) : row.value);
    validateCookbookOperations(cloudOps);
    // The previous cloud array is read only. Its contents join the account's operation log.
    const legacyRaw = await sdk.kv.get('mise_cloud_cookbook'); assertOwner();
    const legacy = typeof legacyRaw === 'string' ? JSON.parse(legacyRaw) : legacyRaw;
    const legacyOps = Array.isArray(legacy) ? legacy.map(recipe => ({ type: 'save', id: recipe.id, recipe, at: 0, opId: `legacy-${recipe.id}` })) : [];
    validateCookbookOperations(legacyOps);
    const merged = mergeCookbooks(readCookbook(owner), { operations: cloudOps }, { operations: legacyOps });
    writeCookbook(merged, owner);
    const uploaded = new Set(cloudOps.map(op => op.opId));
    for (const op of merged.operations) {
      if (uploaded.has(op.opId)) continue;
      await verified(); // No await between this guard and the SDK call that captures credentials.
      assertOwner();
      await sdk.kv.set(`${prefix}${encodeURIComponent(op.opId)}`, JSON.stringify(op));
      assertOwner();
    }
    // Merge changes made locally while network requests were in flight.
    writeCookbook(mergeCookbooks(readCookbook(owner), merged), owner);
    status('Cookbook synced');
  }).catch(error => {
    if (cookbookOwner() === owner) status('Saved on this device • Cloud sync pending; retry when connected');
    throw error;
  });
  queued = operation;
  return operation;
}
export function startCookbookSync() {
  const sync = () => { syncCookbook().catch(() => {}); };
  window.addEventListener('mise-cookbook-change', sync);
  window.addEventListener('mise-auth-change', sync);
  window.addEventListener('online', sync);
  sync();
  return () => {
    window.removeEventListener('mise-cookbook-change', sync);
    window.removeEventListener('mise-auth-change', sync);
    window.removeEventListener('online', sync);
  };
}
