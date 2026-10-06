import { readAccountData, writeAccountData, newId } from './accountStore.js';
import { validCookbookRecipe } from './savedRecipes.js';
export function validateLeftovers(book) {
  if (book?.version !== 1 || !Array.isArray(book.items) || book.items.length > 100 || new Set(book.items.map(i => i.id)).size !== book.items.length) throw new Error('Invalid leftovers.');
  for (const item of book.items) if (!item || typeof item.id !== 'string' || !validCookbookRecipe(item.recipe) || !item.recipe.structured || !Number.isInteger(item.portions) || item.portions < 0 || item.portions > 12 || (item.reminderDate && (!/^\d{4}-\d{2}-\d{2}$/.test(item.reminderDate) || new Date(`${item.reminderDate}T00:00:00Z`).toISOString().slice(0,10) !== item.reminderDate))) throw new Error('Choose a structured recipe, portions and valid reminder date.');
}
export function getLeftovers(owner) { return readAccountData('leftovers_v1', { version: 1, items: [] }, validateLeftovers, owner); }
export function addLeftover(recipe, portions, reminderDate, owner) {
  const book = getLeftovers(owner); book.items.push({ id: newId(), recipe: structuredClone(recipe), portions, reminderDate: reminderDate || null });
  return writeAccountData('leftovers_v1', book, validateLeftovers, owner);
}
export function consumeLeftover(id, owner) {
  const book = getLeftovers(owner), item = book.items.find(i => i.id === id);
  if (!item || item.portions < 1) throw new Error('No recorded portions remain.');
  item.portions--; return writeAccountData('leftovers_v1', book, validateLeftovers, owner);
}
export function removeLeftover(id, owner) { const book = getLeftovers(owner); book.items = book.items.filter(i => i.id !== id); return writeAccountData('leftovers_v1', book, validateLeftovers, owner); }
