import { expect, test } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const password = 'Password123!';

test.describe('upload logs', () => {
  test('staff can open upload logs', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'Upload logs' }).click();
    await expect(page).toHaveURL(/\/dashboard\/upload-logs/);
    await expect(page.getByTestId('upload-logs-table')).toBeVisible({ timeout: 15_000 });
  });
});
