import { cookbookOwner } from './savedRecipes.js';
export function accountKey(name, owner = cookbookOwner()) { return `mise_${name}:${encodeURIComponent(owner)}`; }
export function readAccountData(name, fallback, validate = () => {}, owner = cookbookOwner()) {
  const raw = localStorage.getItem(accountKey(name, owner));
  if (raw === null) return structuredClone(fallback);
  let value;
  try { value = JSON.parse(raw); validate(value); }
  catch { throw new Error('Stored data could not be read. The original copy has been preserved.'); }
  return value;
}
export function writeAccountData(name, value, validate = () => {}, owner = cookbookOwner()) {
  if (owner !== cookbookOwner()) throw new Error('Your account changed. Reopen this page before saving.');
  validate(value);
  localStorage.setItem(accountKey(name, owner), JSON.stringify(value));
  window.dispatchEvent(new Event(`mise-${name}-change`));
  return value;
}
export function newId() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
