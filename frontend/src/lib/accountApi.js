import { getCurrentUser, getGenerationAuthorization } from './auth.js';
const base = import.meta.env?.VITE_API_URL || '';
export async function accountRequest(path, body, method = 'POST') {
  const id = getCurrentUser()?.id, headers = { 'Content-Type': 'application/json', ...getGenerationAuthorization() };
  const res = await fetch(`${base}/api/${path}`, { method, headers, ...(method === 'POST' ? { body: JSON.stringify({ ...body, accountId: `puter:${id}` }) } : {}), signal: AbortSignal.timeout(20000) });
  const data = await res.json().catch(() => null);
  if (!res.ok) { const e = new Error(data?.error || 'The request could not be completed.'); e.code = data?.code; throw e; }
  if (getCurrentUser()?.id !== id || data?.accountId !== `puter:${id}`) throw new Error('Your account changed during this request.');
  return data;
}
