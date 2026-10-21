import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadinessHandler } from '../api/readiness.js';
async function check(env, checkDatabase) {
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
  await createReadinessHandler({ env, checkDatabase })({ method: 'GET' }, res);
  return res.data;
}
test('missing database and failed quota initialization block readiness without exposing credentials', async () => {
  assert.equal((await check({ GROQ_API_KEY: 'secret' }, async () => assert.fail())).ready, false);
  const result = await check({ MONGODB_URI: 'secret-uri', GROQ_API_KEY: 'secret' }, async () => { throw new Error('secret-uri'); });
  assert.equal(result.ready, false); assert.ok(!JSON.stringify(result).includes('secret'));
});
test('readiness reports configured capabilities independently', async () => {
  const env = { MONGODB_URI: 'local', GROQ_API_KEY: 'key', USDA_FDC_API_KEY: 'key' };
  assert.deepEqual((await check(env, async () => {})).capabilities, { recipes: true, photos: false, nutrition: true });
  assert.equal((await check({ ...env, GROQ_VISION_MODEL: 'vision' }, async () => {})).capabilities.photos, true);
});
