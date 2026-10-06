import { queueMeasurement } from './measurements.js';
import { cookbookOwner } from './savedRecipes.js';
const key = owner => `mise_meals_v1:${encodeURIComponent(owner)}`;
export function mealEvents(owner = cookbookOwner()) {
  const raw = localStorage.getItem(key(owner));
  if (!raw) return [];
  const events = JSON.parse(raw);
  if (!Array.isArray(events)) throw new Error('Meal activity data is unreadable and has been preserved.');
  return events;
}
export function recordMealEvent(type, { sessionId, recipeId, rating = null, neededShopping = null, owner = cookbookOwner() } = {}) {
  if (owner !== cookbookOwner()) return false;
  if (!['generated', 'saved', 'cookingStarted', 'mealCompleted'].includes(type)) throw new Error('Unknown meal event.');
  const events = mealEvents(owner), at = new Date().toISOString();
  if (type === 'mealCompleted') {
    if (!sessionId || !events.some(e => e.type === 'cookingStarted' && e.sessionId === sessionId)) return false;
    const prior = events.find(e => e.type === type && e.sessionId === sessionId);
    if (prior) { prior.rating = rating; prior.neededShopping = neededShopping; }
    else events.push({ type, sessionId, recipeId, at, rating, neededShopping });
  } else events.push({ type, sessionId, recipeId, at });
  localStorage.setItem(key(owner), JSON.stringify(events));
  if (type !== 'generated') queueMeasurement(type, { at: type === "mealCompleted" ? events.find(e => e.type === type && e.sessionId === sessionId)?.at : at, rating, neededShopping, ...(type === 'mealCompleted' ? { eventId: `meal:${sessionId}` } : {}) },owner);
  window.dispatchEvent(new Event('mise-meal-activity'));
  return true;
}
export function mealSummary(events, now = Date.now()) {
  const recent = events.filter(e => Number.isFinite(Date.parse(e.at)) && now - Date.parse(e.at) >= 0 && now - Date.parse(e.at) < 30 * 86400000);
  const completed = recent.filter(e => e.type === 'mealCompleted');
  const days = new Set(completed.map(e => e.at.slice(0, 10)));
  const ratings = completed.filter(e => Number.isInteger(e.rating) && e.rating >= 1 && e.rating <= 5);
  return { completedMeals: completed.length, cookingDays: days.size, repeatCookingDays: Math.max(0, days.size - 1),
    cookingStarts: recent.filter(e => e.type === 'cookingStarted').length,
    averageRating: ratings.length ? Number((ratings.reduce((sum, e) => sum + e.rating, 0) / ratings.length).toFixed(1)) : null,
    noShoppingMeals: completed.filter(e => e.neededShopping === false).length,
  };
}
