import { test, expect } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const password = 'Password123!';

test.describe('coding reference', () => {
  test('staff can open search and CPT explorer', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'Coding search' }).click();
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole('heading', { name: 'Coding reference' })).toBeVisible();

    await page.getByLabel('Search').fill('97597');
    await expect(page.getByRole('link', { name: '97597' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: '97597' }).click();
    await expect(page).toHaveURL(/\/cpt\/97597/);
    await expect(page.getByRole('heading', { name: '97597' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'NCCI' })).toBeVisible();
  });
});
