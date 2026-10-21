import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const dotenv = require('dotenv'), mongoose = require('mongoose');
const root = fileURLToPath(new URL('../', import.meta.url));
const config = { ...dotenv.parse(await readFile(new URL('../backend/.env', import.meta.url)).catch(() => '')), ...process.env };
const port = Number(config.PORT || 5000);
const uri = config.MONGO_URI || config.MONGODB_URI;
const children = new Set();
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; process.exitCode = code; for (const child of children) { try { if (process.platform === 'win32') child.kill('SIGTERM'); else process.kill(-child.pid, 'SIGTERM'); } catch { /* Already stopped. */ } } }
function start(name, args, env = process.env) {
  console.log(`Starting ${name}…`);
  const child = spawn('npm', args, { cwd: root, env, stdio: 'inherit', detached: process.platform !== 'win32' }); children.add(child);
  child.on('error', () => { console.error(`${name} could not start.`); stop(1); });
  child.on('exit', code => { children.delete(child); if (!stopping) { console.error(`${name} stopped (${code}).`); stop(code || 1); } });
}
async function waitFor(check, label) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (stopping) throw new Error('Startup stopped.');
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`${label} did not become ready. Check its startup output.`);
}
async function databaseReady() {
  const client = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 500, connectTimeoutMS: 500 });
  try { await client.connect(); await client.db().command({ ping: 1 }); return true; } catch { return false; } finally { await client.close(); }
}
async function apiReady() {
  try { const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(500) }); return response.ok && (await response.json()).ok === true; } catch { return false; }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
try {
  if (!uri) throw new Error('Set MONGODB_URI in backend/.env before starting. See README.md.');
  if (!await databaseReady()) {
    const parsed = new URL(uri);
    if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || (parsed.port && parsed.port !== '27017')) throw new Error('The configured database is unreachable. Check its connection settings.');
    start('MongoDB', ['--prefix', 'backend', 'run', 'dev:db']);
    await waitFor(databaseReady, 'MongoDB');
  } else console.log('Using the running database.');
  if (!await apiReady()) { start('backend', ['run', 'dev:backend']); await waitFor(apiReady, 'Backend'); }
  else console.log('Using the running backend.');
  start('frontend', ['run', 'dev:frontend'], { ...process.env, MISE_DEV_API_TARGET: `http://127.0.0.1:${port}` });
} catch (error) { console.error(error.message); stop(1); }
