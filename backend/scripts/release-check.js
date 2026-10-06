import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
const env = process.env, checks = [];
const add = (name,status,detail) => checks.push({ name,status,detail });
for (const [name,present] of [['Groq key',Boolean(env.GROQ_API_KEY)],['shared MongoDB',Boolean(env.MONGO_URI || env.MONGODB_URI)],['vision model',Boolean(env.GROQ_VISION_MODEL)],['USDA key',Boolean(env.USDA_FDC_API_KEY)]]) add(name,present ? 'CONFIGURED' : 'PENDING',present ? 'Configuration present; service not verified.' : 'Required configuration missing.');
add('provider monetary cap','PENDING','Verify the cap and alerts in https://console.groq.com/docs/spend-limits and record evidence. A request quota is not a monetary cap.');
add('two-device cookbook sync','PENDING','Use two real devices: concurrent edits, delete, offline save, reconnect, sign-out and account switch. Record results in docs/1700_release_verification.md.');
if (env.GROQ_API_KEY) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/models',{ headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },signal:AbortSignal.timeout(10000),redirect:'error' });
    if (!r.ok) throw new Error(`Provider returned HTTP ${r.status}.`);
    const models = new Set(((await r.json()).data || []).map(m => m.id));
    for (const [type,model] of [['text',env.GROQ_TEXT_MODEL || 'openai/gpt-oss-20b'],['vision',env.GROQ_VISION_MODEL]]) if (model) add(`${type} model availability`,models.has(model) ? 'PASS' : 'FAIL',models.has(model) ? 'Listed by provider. Capabilities and generation still require verification.' : 'Configured model is not listed.');
  } catch { add('provider model availability','FAIL','Could not verify credentials or reach the provider.'); }
}
let staging;
try { if (env.MISE_STAGING_URL) { staging = new URL(env.MISE_STAGING_URL); if (staging.protocol !== 'https:' || staging.username || staging.password) throw new Error(); } }
catch { add('staging URL','FAIL','Use an HTTPS staging URL without embedded credentials.'); }
if (!staging) add('staging smoke','PENDING','MISE_STAGING_URL is not configured.');
else {
  const request = async (path,body,token) => {
    const r = await fetch(new URL(`/api/${path}`,staging),{ method:body ? 'POST':'GET',headers:{ 'Content-Type':'application/json',...(token ? { Authorization:`Bearer ${token}` }: {}) },...(body ? { body:JSON.stringify(body) }: {}),signal:AbortSignal.timeout(40000),redirect:'error' });
    return { status:r.status,data:await r.json().catch(() => null) };
  };
  try {
    const health = await request('health'); add('staging health',health.status === 200 && health.data?.ok ? 'PASS':'FAIL','HTTP health endpoint.');
    const unauthorized = await request('generate-recipe',{ question:'potato' }); add('anonymous generation blocked',unauthorized.status === 401 ? 'PASS':'FAIL',`HTTP ${unauthorized.status}.`);
    if (env.MISE_RUN_LIVE_GENERATION !== 'true') add('two-account live generation','PENDING','Set MISE_RUN_LIVE_GENERATION=true with two real PUTER_TEST_TOKEN_A/B tokens to run two quota-counted, billable requests.');
    else if (!env.PUTER_TEST_TOKEN_A || !env.PUTER_TEST_TOKEN_B) add('two-account live generation','PENDING','Both real test-account credentials are required.');
    else {
      const identities = [];
      for (const label of ['A','B']) {
        const result = await request('generate-recipe',{ question:'Make a simple dinner with potato only; no added staples.',constraints:{ pantry:[{name:'potato',quantity:500,unit:'g'}],staples:[],servings:2,maxMinutes:45,equipment:['stovetop','skillet'],strictPantry:true,restrictions:[],excludedIngredients:[] } },env[`PUTER_TEST_TOKEN_${label}`]);
        let valid = false; if (result.status === 200) { try { const { validateRecipes } = await import('../../shared/recipes.js'); validateRecipes({ recipes:result.data.recipes }); valid = typeof result.data.accountId === 'string'; } catch {} }
        add(`live generation account ${label}`,valid ? 'PASS':'FAIL',`HTTP ${result.status}; structured response ${valid ? 'validated':'not validated'}.`);
        if (valid) identities.push(result.data.accountId);
      }
      add('two-account identities',identities.length === 2 && new Set(identities).size === 2 ? 'PASS':'FAIL','Distinct verified account identities; IDs omitted from this report.');
    }
    add('live vision','PENDING','Confirm uploaded ingredient labels and test an actual image on staging. Never silently downgrade a failed image to text.');
    add('shared Mongo quota concurrency','PENDING','Run MONGO_QUOTA_TEST_URI=<dedicated staging test database> npm test; include the concurrency test result.');
  } catch { add('staging requests','FAIL','Unable to complete HTTP verification; no credentials logged.'); }
}
const report = { checkedAt:new Date().toISOString(),ready:checks.every(c => c.status === 'PASS'),checks };
console.log(JSON.stringify(report,null,2));
if (env.MISE_RELEASE_REPORT_PATH) await writeFile(env.MISE_RELEASE_REPORT_PATH,JSON.stringify(report,null,2)+'\n',{mode:0o600});
if (!report.ready) process.exitCode = 1;
