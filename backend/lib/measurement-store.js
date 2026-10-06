import { createHash, randomUUID } from 'node:crypto';
import { connectDB } from '../config/database.js';
import { GenerationError } from './generation-guards.js';
export const EVENT_TYPES = ['generated','generationFailed','saved','cookingStarted','mealCompleted'];
export function cleanEvents(events) {
  if (!Array.isArray(events) || events.length > 20) throw new GenerationError(400,'INVALID_MEASUREMENTS','Send at most 20 measurement events.');
  return events.map(e => {
    if (!e || typeof e.id !== 'string' || !/^[a-zA-Z0-9:_-]{1,160}$/.test(e.id) || !EVENT_TYPES.includes(e.type) || !Number.isFinite(Date.parse(e.at)) || Math.abs(Date.now() - Date.parse(e.at)) > 90 * 86400000) throw new GenerationError(400,'INVALID_MEASUREMENTS','Invalid measurement event.');
    if (e.rating != null && (!Number.isInteger(e.rating) || e.rating < 1 || e.rating > 5)) throw new GenerationError(400,'INVALID_MEASUREMENTS','Invalid rating.');
    if (e.neededShopping != null && typeof e.neededShopping !== 'boolean') throw new GenerationError(400,'INVALID_MEASUREMENTS','Invalid shopping response.');
    if (e.durationMs != null && (!Number.isFinite(e.durationMs) || e.durationMs < 0 || e.durationMs > 120000)) throw new GenerationError(400,'INVALID_MEASUREMENTS','Invalid request duration.');
    // Explicit projection: never store recipe text, ingredient names, auth tokens or client supplied account IDs.
    return { id: e.id, type: e.type, at: new Date(e.at), rating: e.rating ?? null, neededShopping: e.neededShopping ?? null,
      durationMs: e.durationMs ?? null, errorCode: typeof e.errorCode === 'string' && /^[A-Z_]{1,60}$/.test(e.errorCode) ? e.errorCode : null };
  });
}
export function summarizeEvents(events) {
  const meals = events.filter(e => e.type === 'mealCompleted');
  const rated = meals.filter(e => e.rating != null), durations = events.filter(e => e.durationMs != null);
  const cookingByAccount = new Map();
  for (const e of meals) { const subject = e.subject || 'self'; if (!cookingByAccount.has(subject)) cookingByAccount.set(subject,new Set()); cookingByAccount.get(subject).add(new Date(e.at).toISOString().slice(0,10)); }
  return { generated: events.filter(e => e.type === 'generated').length, generationFailures: events.filter(e => e.type === 'generationFailed').length,
    completedMeals: meals.length, cookingStarts: events.filter(e => e.type === 'cookingStarted').length,
    repeatCooks: [...cookingByAccount.values()].filter(days => days.size > 1).length,
    repeatCookingDays: [...cookingByAccount.values()].reduce((sum,days) => sum + Math.max(0,days.size - 1),0),
    noShoppingMeals: meals.filter(e => e.neededShopping === false).length, shoppingMeals: meals.filter(e => e.neededShopping === true).length,
    shoppingAnswered: meals.filter(e => e.neededShopping != null).length,
    averageRating: rated.length ? Number((rated.reduce((s,e) => s + e.rating,0) / rated.length).toFixed(1)) : null,
    averageRequestMs: durations.length ? Math.round(durations.reduce((s,e) => s + e.durationMs,0) / durations.length) : null };
}
export function estimatedCost(usage, env = process.env) {
  let rates; try { rates = JSON.parse(env.GENERATION_MODEL_RATES_JSON || '{}')[usage?.model]; } catch { return null; }
  if (!rates || !['input','output'].every(k => Number.isFinite(rates[k]) && rates[k] >= 0 && rates[k] <= 10000) || !['promptTokens','completionTokens'].every(k => Number.isSafeInteger(usage?.[k]) && usage[k] >= 0)) return null;
  return (rates.input * usage.promptTokens + rates.output * usage.completionTokens) / 1000000;
}
export async function recordOperation({ usage, durationMs, outcome, code }) {
  const connection = await connectDB(); if (!connection?.db) return;
  const collection = connection.db.collection('operating_metrics');
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const validUsage = usage && typeof usage.model === 'string' && usage.model.length < 100 && ['promptTokens','completionTokens'].every(k => Number.isSafeInteger(usage[k]) && usage[k] >= 0);
  await collection.insertOne({ at: new Date(), expiresAt: new Date(Date.now() + 90 * 86400000), durationMs, outcome, code,
    ...(validUsage ? usage : {}), estimatedCostUsd: validUsage ? estimatedCost(usage) : null });
}
export async function measurementDatabase() {
  const connection = await connectDB();
  if (!connection?.db) throw new GenerationError(503,'MEASUREMENTS_UNAVAILABLE','Shared measurements are unavailable. Your local meal journal remains available.');
  const db = connection.db;
  await db.collection('measurement_events').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return db;
}
export const measurementSubject = id => createHash('sha256').update(`mise-measurements:${id}`).digest('hex');
export const consentVersion = () => randomUUID();
