import { test, expect } from '@playwright/test';

test('customer flow (mocked)', async ({ page }) => {
  await page.route('**/api/users/register', async route => route.fulfill({ status: 201, body: JSON.stringify({ message: 'ok' }) }));
  await page.route('**/api/auth/login', async route => route.fulfill({ status: 200, body: JSON.stringify({ user: { id: 1, name: 'User', role: 'customer' } }) }));
  await page.route('**/api/shop', async route => route.fulfill({ status: 200, body: JSON.stringify({ name: 'Shop', currency: 'USD' }) }));
  await page.route('**/api/menu', async route => route.fulfill({ status: 200, body: JSON.stringify([{ id: 1, name: 'Pancake', price: 5 }]) }));

  await page.goto('/');
  await expect(page).toHaveTitle(/Pancakes Shop/i);
});

