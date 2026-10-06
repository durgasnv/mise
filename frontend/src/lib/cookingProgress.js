import { readAccountData, writeAccountData, newId } from './accountStore.js';
import { validCookbookRecipe } from './savedRecipes.js';
const EMPTY = { version: 1, sessions: [] };
function validate(book) {
  if (book?.version !== 1 || !Array.isArray(book.sessions) || book.sessions.length > 12) throw new Error('Invalid cooking progress.');
  for (const s of book.sessions) if (!s || typeof s.sessionId !== 'string' || !validCookbookRecipe(s.recipe) || !['preparing','cooking','complete'].includes(s.phase) || !Number.isInteger(s.currentStepIndex) || s.currentStepIndex < 0 || s.currentStepIndex >= s.recipe.instructions.length || (s.timer && ((s.timer.remainingSeconds !== null && (!Number.isFinite(s.timer.remainingSeconds) || s.timer.remainingSeconds < 0 || s.timer.remainingSeconds > 86400)) || (s.timer.deadline !== null && !Number.isFinite(s.timer.deadline))))) throw new Error('Invalid cooking progress.');
}
const fingerprint = r => JSON.stringify([r.id, r.structured, r.ingredients, r.instructions]);
export function cookingSessions(owner) { return readAccountData('cooking_v1', EMPTY, validate, owner).sessions; }
export function findCookingSession(recipe, owner) { return cookingSessions(owner).find(s => s.phase !== 'complete' && fingerprint(s.recipe) === fingerprint(recipe)) || null; }
export function createCookingSession(recipe, owner) {
  const book = readAccountData('cooking_v1', EMPTY, validate, owner);
  const found = book.sessions.find(s => s.phase !== 'complete' && fingerprint(s.recipe) === fingerprint(recipe));
  if (found) return found;
  const session = { sessionId: newId(), recipe: structuredClone(recipe), phase: 'preparing', currentStepIndex: 0, timer: null, checkedIngredients: {}, completedSteps: {}, reviewConfirmed: false, updatedAt: new Date().toISOString() };
  book.sessions = [session, ...book.sessions].slice(0, 12); writeAccountData('cooking_v1', book, validate, owner); return session;
}
export function updateCookingSession(sessionId, patch, owner) {
  const book = readAccountData('cooking_v1', EMPTY, validate, owner), session = book.sessions.find(s => s.sessionId === sessionId);
  if (!session) throw new Error('Cooking session is unavailable. Reopen the recipe.');
  Object.assign(session, patch, { updatedAt: new Date().toISOString() });
  writeAccountData('cooking_v1', book, validate, owner); return session;
}
export function timerSeconds(timer, now = Date.now()) {
  if (!timer) return null;
  return timer.deadline !== null ? Math.max(0, Math.ceil((timer.deadline - now) / 1000)) : timer.remainingSeconds;
}
export function stepDuration(text) {
  const match = text?.match(/(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(minutes?|mins?|seconds?|secs?)\b/i);
  if (!match) return null;
  return Math.min(86400, Math.round(Number(match[2] || match[1]) * (/^m/i.test(match[3]) ? 60 : 1)));
}
