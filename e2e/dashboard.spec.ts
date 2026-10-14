import { test, expect } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const customerEmail = 'e2e-customer@example.com';
const password = 'Password123!';

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('dashboard', () => {
  test('staff dashboard shows server KPI grid', async ({ page }) => {
    await login(page, adminEmail);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-kpi-grid')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('kpi-batches')).toBeVisible();
    await expect(page.getByTestId('dashboard-period-label')).toContainText(
      /Today|Last 7 days|1 week|1 month|Custom range|All time/,
    );
  });

  test('customer dashboard shows tenant-scoped KPIs', async ({ page }) => {
    await login(page, customerEmail);
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByTestId('dashboard-kpi-grid')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('kpi-batches')).toBeVisible();
    await expect(page.getByTestId('dashboard-recent-batches')).toBeVisible();
  });
});
