import { expect, test } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const password = 'Password123!';

test.describe('users admin', () => {
  test('staff can open users list', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/dashboard\/users/);
    await expect(page.getByTestId('users-admin-table')).toBeVisible({ timeout: 15_000 });
  });
});
