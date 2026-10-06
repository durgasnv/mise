import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('actual HTTP server exposes health and blocks anonymous recipe, nutrition and measurement requests', { timeout:45000 },async()=>{
  const child=spawn(process.execPath,['server.js'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env:{...process.env,PORT:'0',MONGO_URI:'',MONGODB_URI:'',GROQ_API_KEY:'',ENABLE_LEGACY_AUTH:'false'},stdio:['ignore','pipe','ignore']});
  try {
    const port=await new Promise((resolve,reject)=>{
      let output='';const deadline=setTimeout(()=>reject(new Error('Server startup timed out.')),30000);
      child.on('error',e=>{clearTimeout(deadline);reject(e);});child.on('exit',()=>{clearTimeout(deadline);reject(new Error('Server stopped before startup.'));});
      child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/Backend service listening on port (\d+)/);if(match){clearTimeout(deadline);resolve(Number(match[1]));}});
    });
    const base=`http://127.0.0.1:${port}`;
    const health=await fetch(`${base}/api/health`,{signal:AbortSignal.timeout(5000)});assert.equal(health.status,200);assert.equal((await health.json()).ok,true);
    for(const [path,body] of [['generate-recipe',{question:'potato'}],['nutrition',{action:'search',query:'potato',accountId:'puter:test'}],['measurements',{action:'summary',accountId:'puter:test'}]]){
      const r=await fetch(`${base}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});assert.equal(r.status,401,path);assert.equal((await r.json()).code,'AUTH_REQUIRED',path);
    }
  } finally {child.kill('SIGTERM');}
});
