import { canonicalName } from '../../../shared/pantry.js';
import { mergeRevisions, revisionHeads } from '../../../shared/revisions.js';
export const workspaceNames = ['pantry_v1', 'plan_v1', 'cooking_v1', 'leftovers_v1'];
export const workspaceKey = owner => `mise_workspace_v1:${encodeURIComponent(owner)}`;
export function readWorkspace(owner) { return mergeRevisions(JSON.parse(localStorage.getItem(workspaceKey(owner)) || '[]')); }
export function writeWorkspace(owner, log) { localStorage.setItem(workspaceKey(owner), JSON.stringify(mergeRevisions(log))); }
export function workspaceEntities(name, value) {
  const entities = new Map();
  if (!value) return entities;
  if (name === 'pantry_v1') {
    for (const item of value.items) entities.set(`${name}/item/${canonicalName(item.name)}`, item);
    entities.set(`${name}/staples`, value.staples);
    for (const d of value.deductions) entities.set(`${name}/deduction/${d.sessionId}`, d);
  } else {
    const field = name === 'plan_v1' ? 'entries' : name === 'cooking_v1' ? 'sessions' : 'items';
    for (const item of value[field]) entities.set(`${name}/${item.id || item.sessionId}`, item);
  }
  return entities;
}
export function recordWorkspaceChange(name, before, after, owner) {
  if (!workspaceNames.includes(name)) return;
  const prior = workspaceEntities(name, before), next = workspaceEntities(name, after);
  const log = readWorkspace(owner), heads = revisionHeads(log);
  for (const entity of new Set([...prior.keys(), ...next.keys()])) {
    if (JSON.stringify(prior.get(entity)) === JSON.stringify(next.get(entity))) continue;
    log.push({ opId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, entity, parents: (heads.get(entity) || []).map(op => op.opId), value: next.get(entity) ?? null });
  }
  writeWorkspace(owner, log);
}
