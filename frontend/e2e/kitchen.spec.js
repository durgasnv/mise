import { normalizeFood,calculateNutrition } from '../../shared/nutrition.js';
import { test, expect } from '@playwright/test';
import { dinner } from '../../shared/recipe-fixture.js';
import { recipeView } from '../../shared/recipes.js';
import { DEFAULT_CONSTRAINTS } from '../../shared/pantry.js';
const constraints = { ...DEFAULT_CONSTRAINTS, pantry: [{ name: 'potato', quantity: 500, unit: 'g' }] };
const recipe = recipeView(dinner, { id: 'browser-recipe', constraints, review: {} });
test.beforeEach(async ({ page }) => {
  await page.route('https://js.puter.com/**',route => route.abort());
  await page.addInitScript(({ recipe }) => {
    if (!localStorage.getItem('mise_active_chef_user_v3')) localStorage.setItem('mise_active_chef_user_v3', JSON.stringify({ id: 'browser-chef', provider: 'puter', name: 'Test chef', dietaryPreferences: [] }));
    if (!localStorage.getItem('mise_cookbook_v3:puter%3Abrowser-chef')) localStorage.setItem('mise_cookbook_v3:puter%3Abrowser-chef', JSON.stringify({ version: 3, operations: [{ type: 'save', id: recipe.id, opId: 'browser-save', at: 1, recipe }] }));
    window.puter = { authToken: 'mock-browser-token' };
  }, { recipe });
});
test('pantry and weekly planning persist without horizontal overflow', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Manage pantry' }).click();
  await page.getByLabel('Ingredient', { exact: true }).fill('potato'); await page.getByLabel('Amount available').fill('500');
  await page.getByRole('button', { name: 'Save pantry item' }).click(); await expect(page.getByText('500 g', { exact: true })).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Manage pantry' }).click(); await expect(page.getByText('500 g', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '← Kitchen' }).click(); await page.getByRole('button', { name: 'Plan meals & groceries' }).click();
  await page.getByLabel('Saved recipe').selectOption(recipe.id); await page.getByLabel('Servings', { exact: true }).fill('4'); await page.getByRole('button', { name: 'Add dinner' }).click();
  await expect(page.getByText('potato: 300 g missing')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
test('cooking timer and step resume after refresh; dialogs support Escape and focus return', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'View cookbook' }).click(); await page.getByText('Skillet potatoes', { exact: true }).click();
  await page.getByRole('button', { name: 'Open cooking mode' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cooking mode' }); await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  await dialog.getByRole('button', { name: /Start/ }).click(); await page.waitForTimeout(1100); await page.reload();
  await page.getByRole('button', { name: /Skillet potatoes · Step 1/ }).click(); await expect(page.getByRole('dialog', { name: 'Cooking mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog', { name: 'Cooking mode' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Edit recipe', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Edit recipe' })).toBeVisible();
  await page.keyboard.press('Shift+Tab'); expect(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))).toBeTruthy();
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Edit recipe', exact: true })).toBeFocused();
});

test('validated recipe edits persist as a revision and measurements require explicit consent', async ({ page }) => {
  const calls=[];
  await page.route('**/api/measurements',async route => {
    const body=route.request().postDataJSON();calls.push(body);
    await route.fulfill({json:{accountId:'puter:browser-chef',enabled:body.enabled,consentVersion:'browser-consent',accepted:(body.events||[]).map(e=>e.id)}});
  });
  await page.goto('/');await page.getByRole('button',{name:'Meal activity & privacy'}).click();
  await expect(page.getByText(/Sharing: off/)).toBeVisible();expect(calls.length).toBe(0);
  await page.getByRole('button',{name:'Opt in to share activity'}).click();await expect(page.getByText(/Sharing: enabled/)).toBeVisible();
  await page.getByRole('button',{name:'Stop sharing & delete shared activity'}).click();await expect(page.getByText(/Sharing: off/)).toBeVisible();expect(calls.map(c=>c.enabled)).toEqual([true,false]);
  await page.getByRole('button',{name:'Back to kitchen'}).click();await page.getByRole('button',{name:'View cookbook'}).click();await page.getByText('Skillet potatoes',{exact:true}).click();
  await page.getByRole('button',{name:'Edit recipe',exact:true}).click();const editor=page.getByRole('dialog',{name:'Edit recipe'});
  await editor.getByLabel('Title',{exact:true}).fill('Reviewed skillet potatoes');await editor.getByLabel('I reviewed amounts, method, dietary restrictions and cooking guidance.').check();await editor.getByRole('button',{name:'Save validated revision'}).click();
  await expect(page.getByRole('heading',{name:'Reviewed skillet potatoes',exact:true})).toBeVisible();await page.reload();await page.getByRole('button',{name:'View cookbook'}).click();await expect(page.getByText('Reviewed skillet potatoes',{exact:true})).toBeVisible();
});

test('recipe availability uses current pantry stock and source nutrition persists in the cookbook',async({page})=>{
  const food=normalizeFood({fdcId:123,description:'Mock potato record',dataType:'SR Legacy',foodNutrients:[{nutrient:{id:1008,unitName:'kcal'},amount:80}]});
  await page.route('**/api/nutrition',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:{accountId:'puter:browser-chef',...(body.action==='search'?{foods:[{fdcId:123,description:'Mock potato record',dataType:'SR Legacy'}]}:{nutrition:calculateNutrition(body.recipe,body.matches.map(m=>({...m,food})))})}});});
  await page.goto('/');await page.getByRole('button',{name:'Manage pantry'}).click();await page.getByLabel('Ingredient',{exact:true}).fill('potato');await page.getByLabel('Amount available').fill('100');await page.getByRole('button',{name:'Save pantry item'}).click();await page.getByRole('button',{name:'← Kitchen'}).click();
  await page.getByRole('button',{name:'View cookbook'}).click();await page.getByText('Skillet potatoes',{exact:true}).click();await expect(page.getByText('Missing or insufficient ingredients')).toBeVisible();await expect(page.getByRole('button',{name:'Open cooking mode'})).toBeDisabled();
  await page.getByText('Match ingredients & confirm weights').click();await page.getByRole('button',{name:'Search USDA foods'}).click();await page.getByRole('button',{name:'Mock potato record · SR Legacy'}).click();await page.getByRole('button',{name:'Calculate confirmed weights'}).click();await expect(page.getByText('Energy (kcal): 160',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save nutrition with recipe'}).click();await page.reload();await page.getByRole('button',{name:'View cookbook'}).click();await page.getByText('Skillet potatoes',{exact:true}).click();await expect(page.getByText('Energy (kcal): 160',{exact:true})).toBeVisible();
});
