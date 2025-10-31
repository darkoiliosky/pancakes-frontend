import { test, expect } from '@playwright/test';

test('admin flow (mocked)', async ({ page }) => {
  await page.route('**/api/users/login', async route => route.fulfill({ status: 200, body: JSON.stringify({ user: { id: 2, name: 'Admin', role: 'admin' } }) }));
  await page.route('**/api/admin/stats', async route => route.fulfill({ status: 200, body: JSON.stringify({}) }));
  await page.goto('/');
  await expect(page).toHaveTitle(/Pancakes Shop/i);
});

