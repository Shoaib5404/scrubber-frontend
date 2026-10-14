import { test, expect } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const password = 'Password123!';

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('dropdown modernization', () => {
  test('staff batch status AppSelect updates URL', async ({ page }) => {
    await login(page, adminEmail);
    await page.goto('/dashboard/batches');
    await expect(page.getByTestId('batch-status-filter')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('batch-status-filter').click();
    await page.getByRole('option', { name: /error/i }).click();
    await expect(page).toHaveURL(/status=/i);
  });

  test('staff tenant filter uses searchable combobox', async ({ page }) => {
    await login(page, adminEmail);
    await page.goto('/dashboard/batches');
    const tenant = page.getByTestId('batch-tenant-filter');
    await expect(tenant).toBeVisible({ timeout: 15_000 });
    await tenant.click();
    await expect(page.getByPlaceholder(/search tenants/i)).toBeVisible();
    await page.getByPlaceholder(/search tenants/i).fill('a');
    await expect(
      page.getByRole('option').or(page.getByTestId('dropdown-loading')).or(page.getByTestId('dropdown-empty')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('account menu opens and exposes sign out', async ({ page }) => {
    await login(page, adminEmail);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole('button', { name: /account menu/i }).click();
    await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
