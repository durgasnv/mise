import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFood, calculateNutrition, scaleNutrition } from '../../shared/nutrition.js';
import { dinner } from '../../shared/recipe-fixture.js';
import { scaleStructuredRecipe } from '../../shared/recipe-scaling.js';
const food = normalizeFood({ fdcId: 1, description: 'Test data (mock USDA response)', dataType:'SR Legacy', foodNutrients: [{ nutrient:{id:1008,unitName:'kcal'}, amount:80 }, { nutrient:{id:1003,unitName:'g'}, amount:2 }] });
test('calculates from confirmed gram weights and distinguishes missing nutrients from zero', () => {
  const n = calculateNutrition(dinner, [{ ingredientId:'potato', grams:400, food }]);
  assert.deepEqual(n.perServing.energyKcal, { amount:160,complete:true });
  assert.deepEqual(n.perServing.fatG, { amount:0,complete:false });
  const scaled = scaleNutrition(n,dinner,scaleStructuredRecipe(dinner,4));
  assert.equal(scaled.totals.energyKcal.amount,640); assert.equal(scaled.perServing.energyKcal.amount,160);
  assert.equal(scaleNutrition(n,{...dinner,title:'Edited'},dinner),undefined);
});
test('reports partial ingredient coverage and rejects unsupported data or guessed weights', () => {
  assert.equal(calculateNutrition(dinner,[]).missingIngredients.length,1);
  assert.throws(() => normalizeFood({ fdcId:1, dataType:'Branded' }));
  assert.throws(() => calculateNutrition(dinner,[{ingredientId:'potato',grams:0,food}]));
});
import { createNutritionHandler } from '../api/nutrition.js';
function res() { return {setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}}; }
test('nutrition server fetches source data in one bounded batch and ignores client nutrient values', async () => {
  let requests=0;const handler=createNutritionHandler({env:{USDA_FDC_API_KEY:'test-key'},authenticate:async()=>({id:'puter:a'}),reserve:async()=>{},fetchImpl:async(url,options)=>{requests++;assert.ok(url.includes('/foods?'));assert.deepEqual(JSON.parse(options.body).fdcIds,[123]);return {ok:true,json:async()=>[{fdcId:123,description:'mock potato',dataType:'SR Legacy',foodNutrients:[{nutrient:{id:1008,unitName:'kcal'},amount:80}]}]};}});
  const response=res();await handler({method:'POST',body:{action:'calculate',accountId:'puter:a',recipe:dinner,matches:[{ingredientId:'potato',fdcId:123,grams:400,food:{per100g:{energyKcal:900}}}]}},response);
  assert.equal(response.code,200);assert.equal(response.data.nutrition.perServing.energyKcal.amount,160);assert.equal(requests,1);
});
test('nutrition rejects account switches before quota or lookup; missing keys never invent data', async () => {
  let calls=0;const handler=createNutritionHandler({env:{},authenticate:async()=>({id:'puter:a'}),reserve:async()=>{calls++;}});
  let response=res();await handler({method:'POST',body:{action:'search',accountId:'puter:b',query:'potato'}},response);assert.equal(response.code,409);assert.equal(calls,0);
  response=res();await handler({method:'POST',body:{action:'search',accountId:'puter:a',query:'potato'}},response);assert.equal(response.code,503);assert.equal(response.data.code,'NUTRITION_UNAVAILABLE');
});
