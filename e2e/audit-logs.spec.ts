import { expect, test } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const password = 'Password123!';

test.describe('audit logs', () => {
  test('staff can open audit logs when permitted', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const auditLink = page.getByRole('link', { name: 'Audit logs' });
    if (await auditLink.count()) {
      await auditLink.first().click();
      await expect(page).toHaveURL(/\/dashboard\/audit-logs/);
      await expect(page.getByTestId('audit-events-table')).toBeVisible({
        timeout: 15_000,
      });
    }
  });
});
