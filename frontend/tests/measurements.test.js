import test from 'node:test';
import assert from 'node:assert/strict';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
globalThis.window={dispatchEvent(){},puter:{authToken:'test-token'},addEventListener(){},removeEventListener(){}};
const profile={id:'a',provider:'puter',name:'Tester'};store.set('mise_active_chef_user_v3',JSON.stringify(profile));
const { measurementSettings,queueMeasurement,setMeasurementConsent,syncMeasurements }=await import('../src/lib/measurements.js');
test('sharing defaults off and never queues recipe text; opted-in events are acknowledged once',async()=>{
  assert.equal(measurementSettings().enabled,false);queueMeasurement('generated',{question:'secret'});assert.equal(measurementSettings().queue.length,0);
  const payloads=[];globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options.body);payloads.push(body);return {ok:true,json:async()=>({accountId:'puter:a',...(body.action==='consent'?{enabled:body.enabled,consentVersion:'version-a'}:{accepted:body.events.map(e=>e.id)})})};};
  await setMeasurementConsent(true);queueMeasurement('generated',{question:'secret',durationMs:1200});assert.equal(measurementSettings().queue.length,1);
  await syncMeasurements();assert.equal(measurementSettings().queue.length,0);assert.equal(payloads[1].events[0].question,undefined);assert.equal(payloads[1].consentVersion,'version-a');
});
test('offline opt-out immediately stops collection and retries server deletion on reconnect',async()=>{
  queueMeasurement('generated');globalThis.fetch=async()=>{throw new Error('offline');};await assert.rejects(setMeasurementConsent(false));
  assert.equal(measurementSettings().enabled,false);assert.equal(measurementSettings().withdrawalPending,true);assert.equal(measurementSettings().queue.length,0);
  queueMeasurement('generated');assert.equal(measurementSettings().queue.length,0);
  globalThis.fetch=async(_url,options)=>{assert.equal(JSON.parse(options.body).enabled,false);return {ok:true,json:async()=>({accountId:'puter:a',enabled:false})};};await syncMeasurements();assert.equal(measurementSettings().withdrawalPending,false);
});
test('remote consent revocation stops this device and clears an older queue',async()=>{
  globalThis.fetch=async()=>({ok:true,json:async()=>({accountId:'puter:a',enabled:true,consentVersion:'new-consent'})});await setMeasurementConsent(true);queueMeasurement('generated');
  globalThis.fetch=async()=>({ok:false,json:async()=>({code:'CONSENT_REQUIRED',error:'Consent changed'})});await assert.rejects(syncMeasurements());assert.equal(measurementSettings().enabled,false);assert.equal(measurementSettings().queue.length,0);
});
test('accounts cannot read another account queue and corrupt settings are preserved',()=>{
  store.set('mise_active_chef_user_v3',JSON.stringify({...profile,id:'b'}));assert.equal(measurementSettings().enabled,false);
  const key='mise_measurements_v1:puter%3Ab';store.set(key,'{"broken":true}');assert.throws(()=>measurementSettings());assert.equal(store.get(key),'{"broken":true}');
});
