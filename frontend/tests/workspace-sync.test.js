import test from 'node:test';
import assert from 'node:assert/strict';
import { savePantryItem, getPantry, removePantryItem } from '../src/lib/pantryInventory.js';
import { syncWorkspace, workspaceConflicts, resolveWorkspaceConflict } from '../src/lib/workspaceSync.js';
import { mergeRevisions } from '../../shared/revisions.js';
async function browser(run) {
  const previous = { window: globalThis.window, localStorage: globalThis.localStorage };
  const cloud = new Map(); let active = new Map();
  const device = () => new Map([['mise_active_chef_user_v3',JSON.stringify({ provider:'puter',id:'chef' })]]);
  globalThis.localStorage = { getItem:key=>active.get(key) ?? null, setItem:(key,value)=>active.set(key,value) };
  globalThis.window = { dispatchEvent(){}, puter: { authToken:'token', auth:{ getUser:async()=>({ uuid:'chef' }) }, kv:{ list:async({pattern})=>[...cloud].filter(([key])=>key.startsWith(pattern)).map(([key,value])=>({key,value})),set:async(key,value)=>cloud.set(key,value) } } };
  try { await run({ device, use:value=>{active=value;}, cloud }); } finally { Object.assign(globalThis,previous); }
}
test('two devices merge independent pantry entries and review concurrent stock edits and deletion', async()=>browser(async({device,use})=>{
  const a=device(), b=device(); use(a); savePantryItem({name:'potato',quantity:500,unit:'g'}); await syncWorkspace();
  use(b); await syncWorkspace(); assert.equal(getPantry().items[0].quantity,500);
  use(a); savePantryItem({name:'potato',quantity:400,unit:'g'}); savePantryItem({name:'corn',quantity:2,unit:'count'});
  use(b); savePantryItem({name:'potato',quantity:300,unit:'g'}); savePantryItem({name:'garlic',quantity:1,unit:'count'});
  use(a); await syncWorkspace(); use(b); await syncWorkspace();
  assert.equal(getPantry().items.length,3); const [conflict]=workspaceConflicts(); assert.equal(conflict.heads.length,2);
  resolveWorkspaceConflict(conflict.entity,conflict.heads.find(op=>op.value.quantity===400).opId); await syncWorkspace();
  use(a); await syncWorkspace(); assert.equal(workspaceConflicts().length,0); assert.equal(getPantry().items.find(i=>i.name==='potato').quantity,400);
  removePantryItem(getPantry().items.find(i=>i.name==='potato').id); await syncWorkspace(); use(b); await syncWorkspace(); assert.ok(!getPantry().items.some(i=>i.name==='potato'));
}));
test('account changes and invalid cloud history preserve local stock', async()=>browser(async({device,use,cloud})=>{
  const a=device(); use(a); savePantryItem({name:'potato',quantity:500,unit:'g'});
  cloud.set('mise_workspace_v1:chef:bad',JSON.stringify({opId:'bad',entity:'pantry_v1/item/potato',parents:['missing'],value:null}));
  await assert.rejects(syncWorkspace(),/Incomplete/); assert.equal(getPantry().items[0].quantity,500);
  cloud.clear(); window.puter.kv.list=async()=>{ a.set('mise_active_chef_user_v3',JSON.stringify({provider:'puter',id:'other'})); return []; };
  await assert.rejects(syncWorkspace(),/Account changed/); assert.equal(getPantry().items.length,0);
}));
test('revision graphs reject cycles and divergent content under one immutable ID',()=>{
  assert.throws(()=>mergeRevisions([{opId:'a',entity:'x',parents:['b'],value:1},{opId:'b',entity:'x',parents:['a'],value:2}]),/Circular/);
  assert.throws(()=>mergeRevisions([{opId:'a',entity:'x',parents:[],value:1}],[{opId:'a',entity:'x',parents:[],value:2}]),/Conflicting/);
});
