import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dbPath = fileURLToPath(new URL('../.local/mongodb/', import.meta.url));
await mkdir(dbPath, { recursive: true, mode: 0o700 });
const child = spawn(process.env.MONGOD_BIN || 'mongod', [
  '--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27017',
  '--logpath', fileURLToPath(new URL('../.local/mongodb/mongod.log', import.meta.url)),
], { stdio: 'inherit' });
child.on('spawn', () => {
  console.log('Starting local MongoDB on 127.0.0.1:27017. Keep this terminal running.');
  console.log('Use MONGODB_URI=mongodb://127.0.0.1:27017/mise_local in backend/.env.');
});
child.on('error', () => {
  console.error('Could not start mongod. Install MongoDB Community or set MONGOD_BIN to its executable.');
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
  if (code) console.error(`MongoDB exited with code ${code}. Check backend/.local/mongodb/mongod.log.`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
