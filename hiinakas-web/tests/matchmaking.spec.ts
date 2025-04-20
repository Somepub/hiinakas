import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:8087/');
  await page.locator('div').filter({ hasText: 'Enter Your NameSTART GAME' }).nth(2).click();
  await page.getByRole('textbox', { name: 'Your name' }).click();
  await page.getByRole('textbox', { name: 'Your name' }).fill('1241241');
  await page.getByRole('button', { name: 'START GAME' }).click();
  await page.getByText('FIND MATCH').click();
  await page.locator('div').filter({ hasText: /^BACK$/ }).click();
  await page.locator('div').filter({ hasText: /^TOP 10$/ }).click();
  await page.getByText('BACK').click();
  await page.getByText('EXIT FULLSCREEN').click();
  await page.locator('svg').nth(1).click();
  await page.locator('path').nth(1).click();
  await page.locator('path').first().dblclick();
  await page.getByText('Playing as:1241241Players').click();
  await page.locator('div').filter({ hasText: /^FIND MATCH$/ }).click();
  await page.getByText('BACK').click();
});