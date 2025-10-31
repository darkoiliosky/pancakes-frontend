import { test, expect } from '@playwright/test';

test('registration and login flow (mocked)', async ({ page }) => {
  // Intercept API calls to mock backend responses for e2e
  await page.route('**/api/users/register', async route => {
    await route.fulfill({ status: 201, body: JSON.stringify({ message: 'User registered. Please check your email to verify your account.' }) });
  });
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({ status: 200, body: JSON.stringify({ user: { id: 1, name: 'Test User', role: 'customer' } }) });
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/Pancakes Shop/i);
});

