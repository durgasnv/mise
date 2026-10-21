import { getCurrentUser } from './auth.js';
import { cookbookOwner } from './savedRecipes.js';
import { accountKey, writeAccountData } from './accountStore.js';
import { validatePantry } from './pantryInventory.js';
import { validateMealPlan } from './mealPlan.js';
import { validateCooking } from './cookingProgress.js';
import { validateLeftovers } from './leftovers.js';
import { workspaceNames, readWorkspace, writeWorkspace, workspaceEntities } from './workspaceLog.js';
import { mergeRevisions, revisionHeads } from '../../../shared/revisions.js';
const validators = { pantry_v1: validatePantry, plan_v1: validateMealPlan, cooking_v1: validateCooking, leftovers_v1: validateLeftovers };
let queued = Promise.resolve(), message = 'Saved on this device';
export function workspaceStatus() { return message; }
function status(text) { message = text; window.dispatchEvent(new Event('mise-workspace-status')); }
function stored(name, owner) { return JSON.parse(localStorage.getItem(accountKey(name, owner)) || 'null'); }
export function workspaceConflicts(owner = cookbookOwner()) {
  return [...revisionHeads(readWorkspace(owner))].filter(([, heads]) => heads.length > 1).map(([entity, heads]) => ({ entity, heads }));
}
function applyWorkspace(log, owner) {
  const heads = revisionHeads(log), updates = [];
  for (const name of workspaceNames) {
    const previous = stored(name, owner), prior = workspaceEntities(name, previous);
    const values = [...heads].filter(([entity]) => entity.startsWith(`${name}/`)).map(([entity, revisions]) => {
      const current = revisions.find(op => JSON.stringify(op.value) === JSON.stringify(prior.get(entity)));
      return [entity, (current || [...revisions].sort((a,b) => a.opId.localeCompare(b.opId))[0]).value];
    }).filter(([,value]) => value !== null);
    let value;
    if (name === 'pantry_v1') value = { version: 1, items: values.filter(([e]) => e.includes('/item/')).map(([,v]) => v), staples: values.find(([e]) => e.endsWith('/staples'))?.[1] || [], deductions: values.filter(([e]) => e.includes('/deduction/')).map(([,v]) => v) };
    else value = { version: 1, [name === 'plan_v1' ? 'entries' : name === 'cooking_v1' ? 'sessions' : 'items']: values.map(([,v]) => v) };
    validators[name](value); // Validate every store before replacing any local content.
    updates.push([name, value]);
  }
  for (const [name, value] of updates) writeAccountData(name, value, validators[name], owner, { fromSync: true });
}
export function resolveWorkspaceConflict(entity, opId, owner = cookbookOwner()) {
  if (owner !== cookbookOwner()) throw new Error('Your account changed.');
  const log = readWorkspace(owner), heads = revisionHeads(log).get(entity) || [], choice = heads.find(op => op.opId === opId);
  if (!choice) throw new Error('This conflict changed. Reload and review again.');
  const resolved = mergeRevisions(log, [{ opId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, entity, parents: heads.map(op => op.opId), value: choice.value }]);
  applyWorkspace(resolved, owner); writeWorkspace(owner, resolved); window.dispatchEvent(new Event('mise-workspace-change'));
}
export function syncWorkspace() {
  const user = getCurrentUser(), owner = cookbookOwner(), sdk = window.puter, token = sdk?.authToken;
  if (user?.provider !== 'puter' || !token || !sdk?.kv?.list || !sdk?.auth?.getUser) { status('Saved on this device'); return Promise.resolve(); }
  const prefix = `mise_workspace_v1:${encodeURIComponent(user.id)}:`;
  function guard() { if (cookbookOwner() !== owner || window.puter !== sdk || sdk.authToken !== token) throw new Error('Account changed during sync.'); }
  async function verify() { guard(); const identity = await sdk.auth.getUser(); guard(); if (identity?.uuid !== user.id || identity.is_temp) throw new Error('Sign in again before syncing.'); }
  const operation = queued.catch(() => {}).then(async () => {
    await verify(); status('Syncing pantry, plans and progress…');
    const known = revisionHeads(readWorkspace(owner));
    for (const name of workspaceNames) {
      const current = stored(name, owner); if (!current) continue; validators[name](current);
      const entities = workspaceEntities(name, current);
      // Seed existing local data once; previously deleted entities have history and stay deleted.
      const seeded = new Map([...entities].filter(([e]) => !known.has(e) && !readWorkspace(owner).some(op => op.entity === e)));
      if (seeded.size) {
        const log = readWorkspace(owner);
        for (const [entity,value] of seeded) log.push({ opId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, entity, parents: [], value });
        writeWorkspace(owner, log);
      }
    }
    const rows = await sdk.kv.list({ pattern: prefix, returnValues: true }); guard();
    if (!Array.isArray(rows)) throw new Error('Cloud data is unreadable.');
    const cloud = rows.filter(row => row.key?.startsWith(prefix)).map(row => typeof row.value === 'string' ? JSON.parse(row.value) : row.value);
    const merged = mergeRevisions(readWorkspace(owner), cloud);
    // Reject unknown stores, and validate all candidate data before any upload.
    if (merged.some(op => !workspaceNames.some(name => op.entity.startsWith(`${name}/`)))) throw new Error('Unknown cloud data.');
    for (const op of merged) {
      if (op.value === null) continue;
      const name = op.entity.split('/')[0];
      let sample;
      if (name === 'pantry_v1') sample = { version: 1, items: op.entity.includes('/item/') ? [op.value] : [], staples: op.entity.endsWith('/staples') ? op.value : [], deductions: op.entity.includes('/deduction/') ? [op.value] : [] };
      else sample = { version: 1, [name === 'plan_v1' ? 'entries' : name === 'cooking_v1' ? 'sessions' : 'items']: [op.value] };
      validators[name](sample);
      if (!workspaceEntities(name, sample).has(op.entity)) throw new Error('Cloud entity does not match its content.');
    }
    applyWorkspace(merged, owner); writeWorkspace(owner, merged);
    const uploaded = new Set(cloud.map(op => op.opId));
    for (const op of merged) if (!uploaded.has(op.opId)) { await verify(); guard(); await sdk.kv.set(`${prefix}${encodeURIComponent(op.opId)}`, JSON.stringify(op)); guard(); }
    const final = mergeRevisions(readWorkspace(owner), merged); applyWorkspace(final, owner); writeWorkspace(owner, final);
    status(workspaceConflicts(owner).length ? 'Synced • Review conflicting changes below' : 'Pantry, plans and progress synced');
  }).catch(error => { if (cookbookOwner() === owner) status('Saved on this device • Sync pending; retry when connected'); throw error; });
  queued = operation; return operation;
}
export function startWorkspaceSync() {
  let timer;
  const sync = () => { clearTimeout(timer); timer = setTimeout(() => syncWorkspace().catch(() => {}), 800); };
  const events = ['mise-workspace-change', 'mise-auth-change', 'online', 'focus'];
  for (const event of events) window.addEventListener(event, sync);
  sync();
  const poll = setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 60000);
  return () => { clearInterval(poll); clearTimeout(timer); for (const event of events) window.removeEventListener(event, sync); };
}
