import { reserveMongoBucket } from '../lib/generation-quota.js';
import { authenticateGeneration } from '../lib/generation-auth.js';
import { GenerationError } from '../lib/generation-guards.js';
import { cleanEvents, summarizeEvents, measurementDatabase, measurementSubject, consentVersion } from '../lib/measurement-store.js';
export function createMeasurementsHandler({ authenticate = authenticateGeneration, database = measurementDatabase, env = process.env, reserve = reserveMeasurement } = {}) {
  return async (req,res) => {
    res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); res.setHeader('Cache-Control','no-store');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !['consent','events','summary','admin'].includes(body.action) || (body.action === 'consent' && typeof body.enabled !== 'boolean')) throw new GenerationError(400,'INVALID_MEASUREMENTS','Choose a measurement action.');
      const events = body.action === 'events' ? cleanEvents(body.events) : [];
      const identity = await authenticate(req);
      if (body.accountId !== identity.id) throw new GenerationError(409,'ACCOUNT_CHANGED','Your account changed. Retry after signing in.');
      const adminIds = (env.MISE_ADMIN_PUTER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (body.action === 'admin' && !adminIds.includes(identity.id)) throw new GenerationError(403,'ADMIN_REQUIRED','Only configured operators can view aggregate measurements.');
      const db = await database(), subject = measurementSubject(identity.id);
      const consents = db.collection('measurement_consents'), collection = db.collection('measurement_events');
      if (!(body.action === 'consent' && !body.enabled)) await reserve(db,subject);
      if (body.action === 'consent') {
        const version = consentVersion();
        // Revoking changes the version before deletion. Writers recheck it after inserting.
        await consents.updateOne({ _id: subject }, { $set: { enabled: body.enabled, version, updatedAt: new Date() } }, { upsert: true });
        if (!body.enabled) await collection.deleteMany({ subject });
        return res.status(200).json({ accountId: identity.id, enabled: body.enabled, consentVersion: version });
      }
      if (body.action === 'events') {
        const consent = await consents.findOne({ _id: subject });
        if (!consent?.enabled || body.consentVersion !== consent.version) throw new GenerationError(409,'CONSENT_REQUIRED','Measurement sharing is disabled.');
        for (const event of events) await collection.updateOne({ _id: `${subject}:${event.id}` }, { $set: { ...event, subject, consentVersion: consent.version, expiresAt: new Date(event.at.getTime() + 90 * 86400000) } }, { upsert: true });
        const after = await consents.findOne({ _id: subject });
        if (!after?.enabled || after.version !== consent.version) { await collection.deleteMany({ subject, consentVersion: consent.version }); throw new GenerationError(409,'CONSENT_REQUIRED','Your measurement consent changed.'); }
        return res.status(200).json({ accountId: identity.id, accepted: events.map(e => e.id) });
      }
      const active = body.action === 'admin' ? await consents.find({ enabled: true }).toArray() : [await consents.findOne({ _id: subject })].filter(c => c?.enabled);
      const cutoff = new Date(Date.now() - 30 * 86400000);
      const query = active.length ? { at: { $gte: cutoff }, $or: active.map(c => ({ subject: c._id, consentVersion: c.version })) } : null;
      const data = query ? await collection.find(query).toArray() : [];
      const summary = summarizeEvents(data);
      let operations;
      if (body.action === 'admin') {
        const rows = await db.collection('operating_metrics').find({ at: { $gte: cutoff } }).toArray();
        operations = { attempts: rows.length, failures: rows.filter(r => r.outcome === 'failed').length,
          promptTokens: rows.reduce((s,r) => s + (r.promptTokens || 0),0), completionTokens: rows.reduce((s,r) => s + (r.completionTokens || 0),0),
          estimatedCostUsd: rows.reduce((s,r) => s + (r.estimatedCostUsd || 0),0), unpricedAttempts: rows.filter(r => r.estimatedCostUsd == null).length };
      }
      return res.status(200).json({ accountId: identity.id, enabled: active.length > 0, summary, ...(operations ? { consentingAccounts: active.length, operations } : {}) });
    } catch(e) { const known = e instanceof GenerationError; return res.status(known ? e.status : 503).json({ code: known ? e.code : 'MEASUREMENTS_UNAVAILABLE', error: known ? e.message : 'Shared measurements could not be updated. Please retry.' }); }
  };
}
async function reserveMeasurement(db,subject) {
  const collection = db.collection('generation_quotas'), now = Date.now();
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  for (const [key,limit] of [[subject,60],['all',1000]]) if (!await reserveMongoBucket(collection,{ id: `measurement:${key}:${Math.floor(now/60000)}`,limit,expiresAt:new Date(now+86400000) })) throw new GenerationError(429,'MEASUREMENT_LIMIT','Please wait a minute before refreshing shared activity.');
}
export default createMeasurementsHandler();
