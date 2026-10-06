import { canonicalName, comparable, UNITS } from '../../../shared/pantry.js';
import { readAccountData, writeAccountData, newId } from './accountStore.js';
const EMPTY = { version: 1, items: [], staples: [], deductions: [] };
function validate(book) {
  if (book?.version !== 1 || !Array.isArray(book.items) || book.items.length > 100 || !Array.isArray(book.staples) || book.staples.some(s => typeof s !== 'string' || s.length > 120) || !Array.isArray(book.deductions)) throw new Error('Invalid pantry data.');
  const names = new Set(), ids = new Set();
  for (const i of book.items) {
    if (!i || typeof i.id !== 'string' || typeof i.name !== 'string' || !i.name.trim() || i.name.length > 120 || !UNITS.includes(i.unit) || (i.quantity !== null && (!Number.isFinite(i.quantity) || i.quantity < 0 || i.quantity > 100000)) || (i.expiresOn !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(i.expiresOn) || new Date(`${i.expiresOn}T00:00:00Z`).toISOString().slice(0, 10) !== i.expiresOn))) throw new Error('Check pantry names, amounts, units and dates.');
    const name = canonicalName(i.name);
    if (names.has(name) || ids.has(i.id)) throw new Error('Each pantry ingredient must be unique.');
    names.add(name); ids.add(i.id);
  }
  if (book.deductions.some(d => typeof d.sessionId !== 'string')) throw new Error('Invalid pantry deduction record.');
}
export function getPantry(owner) { return readAccountData('pantry_v1', EMPTY, validate, owner); }
export function activePantry(owner) { return getPantry(owner).items.filter(i => i.quantity !== 0); }
export function savePantryItem(item, owner) {
  const book = getPantry(owner), match = book.items.find(i => i.id === item.id || canonicalName(i.name) === canonicalName(item.name));
  const next = { id: match?.id || newId(), name: item.name.trim(), quantity: item.quantity, unit: item.unit, expiresOn: item.expiresOn ?? match?.expiresOn ?? null };
  book.items = match ? book.items.map(i => i.id === match.id ? next : i) : [...book.items, next];
  return writeAccountData('pantry_v1', book, validate, owner);
}
export function removePantryItem(id, owner) {
  const book = getPantry(owner); book.items = book.items.filter(i => i.id !== id);
  return writeAccountData('pantry_v1', book, validate, owner);
}
export function saveFormPantry(items, staples, owner) {
  const book = getPantry(owner);
  for (const item of items) {
    const prior = book.items.find(i => canonicalName(i.name) === canonicalName(item.name));
    if (prior) Object.assign(prior, item);
    else book.items.push({ ...item, id: newId(), expiresOn: null });
  }
  book.staples = [...staples]; return writeAccountData('pantry_v1', book, validate, owner);
}
export function expiryStatus(date, today = new Date().toISOString().slice(0, 10)) {
  if (!date) return '';
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  return days < 0 ? 'Past entered date — review this item' : days <= 2 ? `Entered date in ${days} day${days === 1 ? '' : 's'}` : `Entered date: ${date}`;
}
export function deductionPreview(recipe, book = getPantry()) {
  const result = [], aggregated = new Map();
  for (const i of recipe.structured?.ingredients || []) {
    const name = canonicalName(i.name), entry = book.items.find(p => canonicalName(p.name) === name);
    const amount = entry?.quantity !== null && entry ? comparable(i.quantity, i.unit, entry.unit) : null;
    if (amount === null || !entry) { result.push({ name: i.name, check: 'Update this item manually: its available amount or unit cannot be matched.' }); continue; }
    const row = aggregated.get(entry.id) || { id: entry.id, name: entry.name, used: 0, unit: entry.unit, available: entry.quantity };
    row.used += amount; aggregated.set(entry.id, row);
  }
  return [...aggregated.values(), ...result];
}
export function deductPantry(sessionId, lines, owner) {
  if (typeof sessionId !== 'string' || !sessionId) throw new Error('Complete a cooking session before updating your pantry.');
  const book = getPantry(owner);
  if (book.deductions.some(d => d.sessionId === sessionId)) return { book, alreadyApplied: true };
  if (!Array.isArray(lines) || lines.length > 100 || new Set(lines.map(l => l.id)).size !== lines.length) throw new Error('Review actual ingredient use.');
  for (const line of lines) {
    const item = book.items.find(i => i.id === line.id);
    if (!item || item.quantity === null || !Number.isFinite(line.used) || line.used < 0 || line.used > item.quantity) throw new Error(`Check the amount used for ${item?.name || 'this item'}; it exceeds your recorded inventory.`);
  }
  for (const line of lines) book.items.find(i => i.id === line.id).quantity = Number((book.items.find(i => i.id === line.id).quantity - line.used).toFixed(6));
  book.deductions.push({ sessionId, at: new Date().toISOString(), lines: structuredClone(lines) });
  return { book: writeAccountData('pantry_v1', book, validate, owner), alreadyApplied: false };
}
