import { test, expect } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const customerEmail = 'e2e-customer@example.com';
const password = 'Password123!';

test.describe('auth', () => {
  test('bad password shows friendly error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin login lands on staff dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Staff dashboard' })).toBeVisible();
  });

  test('customer login lands on portal', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(customerEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByRole('heading', { name: 'Customer portal' })).toBeVisible();
  });

  test('dashboard fails closed when anonymous', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
