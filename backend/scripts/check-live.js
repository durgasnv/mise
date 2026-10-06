import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { authenticateGeneration } from '../lib/generation-auth.js';
import { callGroq } from '../api/generate-recipe.js';
import { validateGenerationBody } from '../lib/generation-guards.js';
import { validateRecipes } from '../../shared/recipes.js';
import { reviewPantry } from '../../shared/pantry.js';
import { reviewSafety } from '../../shared/recipe-safety.js';
const checks = [], env = process.env;
const record = (name, status, detail) => { checks.push({ name, status, detail }); console.log(`${status}: ${name} — ${detail}`); };
const base = new URL(env.MISE_VERIFY_URL || 'http://127.0.0.1:5000');
if (base.username || base.password || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1','localhost'].includes(base.hostname)))) throw new Error('Use HTTPS or a loopback HTTP verification URL without credentials.');
try {
  const response = await fetch(new URL('/api/readiness', base), { signal: AbortSignal.timeout(10000) });
  const data = await response.json(); record('API readiness', response.ok && data.ready ? 'PASS' : 'FAIL', 'Configuration and quota storage check.');
} catch { record('API readiness', 'FAIL', 'Could not reach the verification API.'); }
const accounts = [];
for (const label of ['A','B']) {
  const token = env[`PUTER_TEST_TOKEN_${label}`];
  if (!token) { record(`Puter account ${label}`, 'PENDING', 'Permanent test-account token missing.'); continue; }
  try { const identity = await authenticateGeneration({ headers: { authorization: `Bearer ${token}` } }); accounts.push(identity.id); record(`Puter account ${label}`, 'PASS', 'Identity verified; identifying data omitted.'); }
  catch { record(`Puter account ${label}`, 'FAIL', 'Identity could not be verified.'); }
}
record('distinct accounts', accounts.length === 2 ? (new Set(accounts).size === 2 ? 'PASS':'FAIL') : 'PENDING', 'Two distinct permanent identities required.');
if (env.MISE_RUN_LIVE_GENERATION === 'true' && env.GROQ_API_KEY) {
  const input = validateGenerationBody({ question: 'Make a simple potato dinner.', constraints: { pantry: [{ name: 'potato', quantity: 500, unit: 'g' }], staples: [], servings: 2, maxMinutes: 45, equipment: ['stovetop','skillet'], strictPantry: true, restrictions: [], excludedIngredients: [] } });
  try {
    const recipes = validateRecipes(await callGroq(input));
    for (const recipe of recipes) { reviewPantry(recipe, input.constraints); reviewSafety(recipe, input.constraints); }
    record('live text provider', 'PASS', `${recipes.length} structured recipes validated; one provider call. This is not a signed-in HTTP flow.`);
  } catch (error) { record('live text provider', 'FAIL', error.code || 'Response did not pass recipe validation.'); }
} else record('live text provider', 'PENDING', 'Set MISE_RUN_LIVE_GENERATION=true to allow one billable provider check.');
record('photo scanning', 'PENDING', env.GROQ_VISION_MODEL ? 'A real pantry photo and confirmed ingredient labels are required.' : 'Vision model missing.');
if (env.USDA_FDC_API_KEY) {
  try {
    const response = await fetch('https://api.nal.usda.gov/fdc/v1/foods/search', { method: 'POST', headers: { 'Content-Type':'application/json', 'X-Api-Key':env.USDA_FDC_API_KEY }, body: JSON.stringify({ query:'potato', dataType:['Foundation','SR Legacy'], pageSize:1 }), signal:AbortSignal.timeout(15000) });
    const data = await response.json(); record('live nutrition source', response.ok && data.foods?.length ? 'PASS':'FAIL', 'Source lookup; food matching/calculation still requires review.');
  } catch { record('live nutrition source','FAIL','Could not retrieve source food data.'); }
} else record('live nutrition source','PENDING','USDA key missing.');
record('two-device cloud and accessibility', 'PENDING', 'Complete the real-device checklist in docs/1700_release_verification.md.');
const path = env.MISE_LIVE_REPORT_PATH || new URL('../../docs/live-verification.json', import.meta.url);
await writeFile(path, JSON.stringify({ checkedAt:new Date().toISOString(), checks }, null, 2)+'\n', { mode:0o600 });
if (checks.some(check => check.status === 'FAIL')) process.exitCode = 1;
