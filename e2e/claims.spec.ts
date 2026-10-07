import { test, expect } from '@playwright/test';

const customerEmail = 'e2e-customer@example.com';
const password = 'Password123!';

test.describe('claims', () => {
  test('customer can open claim from owned batch', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(customerEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/portal/);

    await page.getByRole('link', { name: 'e2e-customer-own.edi' }).click({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/portal\/batches\/\d+/, { timeout: 15_000 });

    const claimLink = page.locator('[data-testid^="claim-link-"]').first();
    await expect(claimLink).toBeVisible();
    await claimLink.click();
    await expect(page).toHaveURL(/\/portal\/claims\/\d+/);
    await expect(page.getByRole('button', { name: 'Validate claim' })).toBeVisible();
    await expect(page.getByText('Service lines')).toBeVisible();
  });
});
