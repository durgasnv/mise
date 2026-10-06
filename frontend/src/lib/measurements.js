import { cookbookOwner } from './savedRecipes.js';
import { readAccountData, writeAccountData, newId } from './accountStore.js';
import { accountRequest } from './accountApi.js';
const validate = data => { if (data?.version !== 1 || typeof data.enabled !== 'boolean' || typeof data.withdrawalPending !== 'boolean' || !Array.isArray(data.queue) || data.queue.length > 200) throw new Error('Invalid measurement settings.'); };
export const measurementSettings = (owner = cookbookOwner()) => readAccountData('measurements_v1', { version: 1, enabled: false, withdrawalPending: false, consentVersion: null, queue: [] }, validate, owner);
const persist = (data,owner) => writeAccountData('measurements_v1',data,validate,owner);
let consentBusy = false;
export async function setMeasurementConsent(enabled) {
  consentBusy = true;
  try {
  const owner = cookbookOwner(), data = measurementSettings(owner);
  if (!owner.startsWith('puter:')) throw new Error('Sign in with a real Puter account to share measurements.');
  if (!enabled) persist({ ...data, enabled: false, withdrawalPending: true, queue: [] },owner);
  const result = await accountRequest('measurements',{ action: 'consent', enabled });
  persist({ ...data, enabled, consentVersion: result.consentVersion, withdrawalPending: false, queue: [] },owner);
  } finally { consentBusy = false; }
}
export function queueMeasurement(type, metadata = {}, owner = cookbookOwner()) {
  try {
    if (owner !== cookbookOwner() || !owner.startsWith('puter:')) return;
    const data = measurementSettings(owner); if (!data.enabled || data.withdrawalPending) return;
    const id = metadata.eventId || newId();
    const event = { id, type, at: metadata.at || new Date().toISOString(), rating: metadata.rating ?? null, neededShopping: metadata.neededShopping ?? null,
      durationMs: metadata.durationMs ?? null, errorCode: metadata.errorCode ?? null };
    const queue = data.queue.filter(e => e.id !== id); queue.push(event);
    persist({ ...data, queue: queue.slice(-200) },owner);
  } catch { /* Optional measurement storage never blocks cooking. */ }
}
let syncing = null;
export function syncMeasurements() {
  if (consentBusy) return Promise.resolve();
  if (syncing) return syncing;
  syncing = (async () => {
    const owner = cookbookOwner(); if (!owner.startsWith('puter:')) return;
    let data = measurementSettings(owner);
    if (data.withdrawalPending) { await accountRequest('measurements',{ action: 'consent', enabled: false }); persist({ ...data, enabled: false, withdrawalPending: false, queue: [] },owner); return; }
    if (!data.enabled || !data.queue.length) return;
    const batch = data.queue.slice(0,20), result = await accountRequest('measurements',{ action: 'events', consentVersion: data.consentVersion, events: batch });
    if (owner !== cookbookOwner()) return;
    data = measurementSettings(owner);
    if (data.enabled && !data.withdrawalPending) persist({ ...data, queue: data.queue.filter(e => !result.accepted.includes(e.id) || !batch.some(sent => sent.id === e.id && JSON.stringify(sent) === JSON.stringify(e))) },owner);
  })().finally(() => { syncing = null; });
  return syncing;
}
export function startMeasurementSync() {
  let stopped = false;
  const run = () => { if (!stopped) syncMeasurements().catch(() => {}); };
  const names = ['online','mise-auth-change','mise-measurements_v1-change'];
  names.forEach(name => window.addEventListener(name,run));
  const timer = setInterval(run,30000); run();
  return () => { stopped = true; clearInterval(timer); names.forEach(name => window.removeEventListener(name,run)); };
}
