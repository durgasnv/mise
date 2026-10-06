import { getQuotaCollection } from '../lib/generation-quota.js';

export function createReadinessHandler({ env = process.env, checkDatabase = getQuotaCollection } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    let database = false;
    if (env.MONGO_URI || env.MONGODB_URI) {
      try { await checkDatabase(); database = true; } catch { /* No connection details in public responses. */ }
    }
    const text = database && Boolean(env.GROQ_API_KEY);
    return res.status(200).json({ ready: text, capabilities: {
      recipes: text, photos: text && Boolean(env.GROQ_VISION_MODEL?.trim()), nutrition: database && Boolean(env.USDA_FDC_API_KEY),
    }, message: text ? 'The recipe service is ready.' : 'The recipe service is unavailable. Please try again shortly.' });
  };
}
export default createReadinessHandler();
