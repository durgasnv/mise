import { test, expect } from '@playwright/test';
test.beforeEach(async ({page}) => {
  await page.route('https://js.puter.com/**',route => route.abort());
});
test('landing motion leaves the headline, scroll content and quick-start form usable',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:'Cook with what you have.'})).toBeVisible();
  await page.getByLabel('Ingredient 1',{exact:true}).fill('Tomato');await expect(page.getByLabel('Ingredient 1',{exact:true})).toHaveValue('Tomato');
  await page.locator('.dish-card').first().scrollIntoViewIfNeeded();await expect(page.locator('.dish-card').first()).toHaveCSS('opacity','1');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();expect(errors).toEqual([]);
});
test('reduced motion shows all landing content immediately',async({page})=>{
  const sceneRequests=[];page.on('request',r=>{if(r.url().includes('createKitchenScene'))sceneRequests.push(r.url());});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.hero-heading > span').first()).toHaveCSS('opacity','1');await expect(page.locator('.feature-row').first()).toHaveCSS('opacity','1');
  await expect(page.locator('.hero-scene canvas')).toHaveCount(0);
  await page.getByRole('button',{name:'Make dinner'}).click();await expect(page.getByRole('dialog',{name:'Sign in'})).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Make dinner'})).toBeFocused();expect(sceneRequests).toEqual([]);
});

test('3D illustration renders, pauses offscreen and falls back after context loss',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});const scene=page.locator('.hero-scene');await expect(scene).toHaveAttribute('data-state','ready',{timeout:20000});
  const canvas=scene.locator('canvas');await expect(canvas).toBeVisible();await page.locator('.editorial-footer').scrollIntoViewIfNeeded();await expect(canvas).toHaveAttribute('data-rendering','paused');
  const frame=await canvas.getAttribute('data-frame');await page.waitForTimeout(400);expect(await canvas.getAttribute('data-frame')).toBe(frame);
  await page.locator('.hero-plate').scrollIntoViewIfNeeded();await expect(canvas).toHaveAttribute('data-rendering','active');
  await canvas.dispatchEvent('webglcontextlost');await expect(scene).toHaveAttribute('data-state','fallback');await expect(page.locator('.hero-plate-fallback')).toHaveCSS('opacity','1');
});
test('WebGL unavailable keeps a static illustration and usable navigation',async({page})=>{
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
  await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('.hero-plate-fallback')).toBeVisible();await page.waitForTimeout(1000);await expect(page.locator('.hero-scene canvas')).toHaveCount(0);
  await page.getByRole('button',{name:'Make dinner'}).click();await expect(page.getByRole('dialog',{name:'Sign in'})).toBeVisible();
});
