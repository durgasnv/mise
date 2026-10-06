import { authenticateGeneration } from '../lib/generation-auth.js';
import { GenerationError } from '../lib/generation-guards.js';
import { connectDB } from '../config/database.js';
import { reserveMongoBucket } from '../lib/generation-quota.js';
import { createHash } from 'node:crypto';
import { validateRecipes } from '../../shared/recipes.js';
import { normalizeFood, calculateNutrition } from '../../shared/nutrition.js';
const URL_BASE = 'https://api.nal.usda.gov/fdc/v1';
export function createNutritionHandler({ env = process.env, authenticate = authenticateGeneration, fetchImpl = fetch, reserve = reserveNutrition } = {}) {
  const cache = new Map();
  async function request(path, body) {
    if (!env.USDA_FDC_API_KEY) throw new GenerationError(503, 'NUTRITION_UNAVAILABLE', 'Nutrition lookup needs a configured USDA FoodData Central API key.');
    const res = await fetchImpl(`${URL_BASE}${path}?api_key=${encodeURIComponent(env.USDA_FDC_API_KEY)}`, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!res.ok) throw new GenerationError(res.status === 429 ? 429 : 502, 'NUTRITION_LOOKUP_FAILED', 'USDA lookup is unavailable. Please retry later.');
    return res.json();
  }
  return async (req,res) => {
    res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); res.setHeader('Cache-Control','no-store');
    if (req.method === 'OPTIONS') return res.status(204).end(); if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !['search','calculate'].includes(body.action)) throw new GenerationError(400,'INVALID_NUTRITION','Choose a food search or nutrition calculation.');
      if (body.action === 'search' && (typeof body.query !== 'string' || !body.query.trim() || body.query.length > 120)) throw new GenerationError(400,'INVALID_NUTRITION','Enter a food name under 120 characters.');
      if (body.action === 'calculate') {
        try { validateRecipes({ recipes: [body.recipe] }); }
        catch { throw new GenerationError(400,'INVALID_NUTRITION','Choose a complete structured recipe.'); }
        if (!Array.isArray(body.matches) || body.matches.length > 40 || new Set(body.matches.map(m => m?.ingredientId)).size !== body.matches.length || body.matches.some(m => !m || !body.recipe.ingredients.some(i => i.id === m.ingredientId) || !Number.isSafeInteger(m.fdcId) || m.fdcId < 1 || !Number.isFinite(m.grams) || m.grams <= 0 || m.grams > 100000)) throw new GenerationError(400,'INVALID_NUTRITION','Confirm food matches and gram weights.');
      }
      const identity = await authenticate(req);
      if (body.accountId !== identity.id) throw new GenerationError(409,'ACCOUNT_CHANGED','Your account changed. Retry after signing in.');
      await reserve(identity);
      if (body.action === 'search') {
        const data = await request('/foods/search', { query: body.query.trim(), dataType: ['Foundation','SR Legacy'], pageSize: 8 });
        return res.status(200).json({ accountId: identity.id, foods: (data.foods || []).filter(f => Number.isSafeInteger(f.fdcId) && ['Foundation','SR Legacy'].includes(f.dataType)).map(f => ({ fdcId: f.fdcId, description: f.description, dataType: f.dataType })) });
      }
      const ids = [...new Set(body.matches.map(m => m.fdcId))];
      const uncached = ids.filter(id => !cache.get(id) || cache.get(id).expires <= Date.now());
      if (uncached.length) {
        const foods = await request('/foods', { fdcIds: uncached, format: 'full' });
        if (!Array.isArray(foods)) throw new Error('Missing USDA foods.');
        for (const source of foods) {
          const value = normalizeFood(source);
          if (cache.size >= 100) cache.delete(cache.keys().next().value);
          cache.set(value.fdcId, { value, expires: Date.now() + 30 * 60000 });
        }
      }
      const matches = body.matches.map(m => {
        const source = cache.get(m.fdcId)?.value;
        if (!source) throw new Error('USDA food not found.');
        return { ingredientId: m.ingredientId, grams: m.grams, food: source };
      });
      return res.status(200).json({ accountId: identity.id, nutrition: calculateNutrition(body.recipe, matches) });
    } catch(e) { const known = e instanceof GenerationError; return res.status(known ? e.status : 502).json({ code: known ? e.code : 'NUTRITION_LOOKUP_FAILED', error: known ? e.message : 'Nutrition could not be calculated. Your recipe is unchanged.' }); }
  };
}
async function reserveNutrition(identity) {
  const db = await connectDB(); if (!db?.db) throw new GenerationError(503,'NUTRITION_UNAVAILABLE','Nutrition usage limits are unavailable.');
  const now = Date.now(), user = createHash('sha256').update(identity.id).digest('hex');
  const collection = db.db.collection('generation_quotas');
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  for (const [subject, limit] of [[user, 20], ['all', 100]]) if (!await reserveMongoBucket(collection, { id: `nutrition:${subject}:${Math.floor(now / 60000)}`, limit, expiresAt: new Date(now + 86400000) })) throw new GenerationError(429,'NUTRITION_LIMIT','Please wait a minute before requesting more food lookups.');
}
export default createNutritionHandler();
