import { test, expect } from '@playwright/test';

test('courier flow (mocked)', async ({ page }) => {
  await page.route('**/api/users/login', async route => route.fulfill({ status: 200, body: JSON.stringify({ user: { id: 3, name: 'Courier', role: 'courier' } }) }));
  await page.route('**/api/courier/available', async route => route.fulfill({ status: 200, body: JSON.stringify({ orders: [] }) }));
  await page.goto('/');
  await expect(page).toHaveTitle(/Pancakes Shop/i);
});

