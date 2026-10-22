import { test, expect } from '@playwright/test';
test.beforeEach(async ({page}) => {
  await page.route('https://js.puter.com/**',route => route.abort());
});
test('landing motion leaves the headline, scroll content and quick-start form usable',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:'Cook with what you have.'})).toBeVisible();
  await expect(page.locator('.hero-visual img')).toBeVisible();
  await expect(page.locator('.hero-visual img')).toHaveAttribute('src', /photo-1515003197210-e0cd71810b5f/);
  await expect(page.locator('.dish-card img')).toHaveCount(3);
  await page.getByLabel('Ingredient 1',{exact:true}).fill('Tomato');await expect(page.getByLabel('Ingredient 1',{exact:true})).toHaveValue('Tomato');
  await page.locator('.dish-card').first().scrollIntoViewIfNeeded();await expect(page.locator('.dish-card').first()).toHaveCSS('opacity','1');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();expect(errors).toEqual([]);
});
test('reduced motion shows all landing content immediately',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.hero-heading > span').first()).toHaveCSS('opacity','1');await expect(page.locator('.feature-row').first()).toHaveCSS('opacity','1');
  await page.getByRole('button',{name:'Make dinner'}).click();await expect(page.getByRole('dialog',{name:'Sign in'})).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Make dinner'})).toBeFocused();
});

test('hero headline keeps breathing room above the photograph', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const heading = await page.locator('.hero-heading').boundingBox();
  const photo = await page.locator('.hero-visual').boundingBox();
  expect(photo.y - (heading.y + heading.height)).toBeGreaterThanOrEqual(32);
  const lines = page.locator('.hero-heading > span');
  const first = await lines.nth(0).boundingBox();
  const second = await lines.nth(1).boundingBox();
  expect(second.y - (first.y + first.height)).toBeGreaterThanOrEqual(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
