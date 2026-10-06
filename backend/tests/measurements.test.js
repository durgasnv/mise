import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanEvents, summarizeEvents, estimatedCost } from '../lib/measurement-store.js';
import { createMeasurementsHandler } from '../api/measurements.js';
const now = new Date().toISOString();
test('measurement projection strips private fields and rejects malformed payloads', () => {
  const [e] = cleanEvents([{ id:'one',type:'generated',at:now,question:'private ingredients',email:'secret',durationMs:2500 }]);
  assert.equal(e.question,undefined); assert.equal(e.email,undefined); assert.equal(e.durationMs,2500);
  assert.throws(() => cleanEvents([{id:'one',type:'recipeText',at:now}]));
  assert.throws(() => cleanEvents([{id:'one',type:'mealCompleted',at:now,rating:6}]));
});
test('summaries count confirmed meals, return days and answered shopping separately', () => {
  const days = ['2026-10-01','2026-10-02'];
  const s = summarizeEvents(days.map((day,i) => ({type:'mealCompleted',subject:'hash',at:day,rating:5,neededShopping:i === 0 ? false:null})).concat([{type:'generationFailed',durationMs:3000}]));
  assert.equal(s.completedMeals,2); assert.equal(s.repeatCooks,1); assert.equal(s.repeatCookingDays,1); assert.equal(s.noShoppingMeals,1); assert.equal(s.shoppingAnswered,1); assert.equal(s.generationFailures,1);
});
test('unconfigured or invalid cost rates remain unpriced rather than zero', () => {
  const usage = {model:'model',promptTokens:1000,completionTokens:2000};
  assert.equal(estimatedCost(usage,{}),null);
  assert.equal(estimatedCost(usage,{GENERATION_MODEL_RATES_JSON:'{"model":{"input":1,"output":2}}'}),0.005);
});
function response() { return {setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}}; }
test('server denies mismatched accounts and unauthorized operator access before touching storage', async () => {
  let accesses=0; const handler = createMeasurementsHandler({ authenticate:async () => ({id:'puter:a'}),database:async () => { accesses++;throw new Error(); },env:{} });
  let res=response();await handler({method:'POST',body:{action:'summary',accountId:'puter:b'}},res); assert.equal(res.code,409);
  res=response();await handler({method:'POST',body:{action:'admin',accountId:'puter:a'}},res);assert.equal(res.code,403); assert.equal(accesses,0);
});
test('opt out changes consent then deletes account events; disabled consent cannot accept a batch', async () => {
  const order=[];let enabled=true;const db={collection(name){return name==='measurement_consents' ? {updateOne:async (_q,u)=>{enabled=u.$set.enabled;order.push('consent');},findOne:async()=>({enabled})} : {deleteMany:async()=>order.push('delete'),updateOne:async()=>order.push('insert')};}};
  const handler=createMeasurementsHandler({authenticate:async()=>({id:'puter:a'}),database:async()=>db,reserve:async()=>{}});
  let res=response();await handler({method:'POST',body:{action:'consent',enabled:false,accountId:'puter:a'}},res);assert.equal(res.code,200);assert.deepEqual(order,['consent','delete']);
  res=response();await handler({method:'POST',body:{action:'events',accountId:'puter:a',events:[{id:'one',type:'generated',at:now}]}},res);assert.equal(res.code,409);assert.deepEqual(order,['consent','delete']);
});

test('revoked consent versions cannot restore an older event queue',async()=>{
  let writes=0;const db={collection(name){return name==='measurement_consents' ? {findOne:async()=>({enabled:true,version:'new'})} : {updateOne:async()=>{writes++;}};}};
  const handler=createMeasurementsHandler({authenticate:async()=>({id:'puter:a'}),database:async()=>db,reserve:async()=>{}});
  const res=response();await handler({method:'POST',body:{action:'events',accountId:'puter:a',consentVersion:'old',events:[{id:'one',type:'generated',at:now}]}},res);assert.equal(res.code,409);assert.equal(writes,0);
});
