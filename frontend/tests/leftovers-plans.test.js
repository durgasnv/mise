import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeView } from '../../shared/recipes.js';
import { dinner } from '../../shared/recipe-fixture.js';
import { addLeftover, getLeftovers, consumeLeftover } from '../src/lib/leftovers.js';
import { addPlannedMeal, getMealPlan, repeatPlanWeek, addLeftoverMeal } from '../src/lib/mealPlan.js';
import { shoppingList } from '../../shared/meal-planning.js';
function browser(run) { const previous={localStorage:globalThis.localStorage,window:globalThis.window}, map=new Map(); globalThis.localStorage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};globalThis.window={dispatchEvent(){}};try{run();}finally{Object.assign(globalThis,previous);} }
test('repeat week is idempotent and leftovers reserve portions without adding grocery demand',()=>browser(()=>{
  const recipe=recipeView(dinner);addPlannedMeal('2026-10-06',recipe,2);repeatPlanWeek('2026-10-05');repeatPlanWeek('2026-10-05');assert.equal(getMealPlan().entries.length,2);assert.equal(getMealPlan().entries[1].date,'2026-10-13');
  addLeftover(recipe,3,'2026-10-07');const leftover=getLeftovers().items[0];addLeftoverMeal('2026-10-07',leftover,2);assert.throws(()=>addLeftoverMeal('2026-10-08',leftover,2),/Not enough/);
  assert.equal(shoppingList(getMealPlan().entries.filter(e=>e.kind==='leftover'),[]).length,0);
  consumeLeftover(leftover.id);assert.equal(getLeftovers().items[0].portions,2);
  repeatPlanWeek('2026-10-05');assert.equal(getMealPlan().entries.length,3);
}));
