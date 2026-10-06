import { test, expect } from '@playwright/test';
test.beforeEach(async ({page}) => {
  await page.route('https://js.puter.com/**',route => route.abort());
});
test('landing motion leaves the headline, scroll content and quick-start form usable',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('heading',{name:'Cook with what you have.'})).toBeVisible();
  await page.getByLabel('Ingredient 1',{exact:true}).fill('Tomato');await expect(page.getByLabel('Ingredient 1',{exact:true})).toHaveValue('Tomato');
  await page.locator('.dish-card').first().scrollIntoViewIfNeeded();await expect(page.locator('.dish-card').first()).toHaveCSS('opacity','1');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();expect(errors).toEqual([]);
});
test('reduced motion shows all landing content immediately',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('.hero-heading > span').first()).toHaveCSS('opacity','1');await expect(page.locator('.feature-row').first()).toHaveCSS('opacity','1');
  await page.getByRole('button',{name:'Make dinner'}).click();await expect(page.getByRole('dialog',{name:'Sign in'})).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Make dinner'})).toBeFocused();
});
