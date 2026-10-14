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

test.describe('batches', () => {
  test('customer dashboard and batches are separate routes', async ({ page }) => {
    await login(page, customerEmail);
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('customer-dashboard')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Batches', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/batches/);
    await expect(page.getByRole('heading', { name: 'Batches' })).toBeVisible();
  });

  test('customer sees only own batches and can open detail', async ({ page }) => {
    await login(page, customerEmail);
    await page.goto('/portal/batches');
    await expect(page.getByRole('heading', { name: 'Batches' })).toBeVisible();

    await expect(page.getByTestId('batch-pagination')).toBeVisible({ timeout: 15_000 });
    const ownLink = page.getByRole('link', { name: 'e2e-customer-own.edi' });
    await expect(ownLink).toBeVisible();
    await expect(page.getByRole('link', { name: 'e2e-other-tenant.edi' })).toHaveCount(0);

    await ownLink.click();
    await expect(page).toHaveURL(/\/portal\/batches\/\d+/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'e2e-customer-own.edi' })).toBeVisible();
    await expect(page.getByTestId('claim-pagination')).toBeVisible();
  });

  test('staff dashboard and batches are separate routes', async ({ page }) => {
    await login(page, adminEmail);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('staff-dashboard')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Batches', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/batches/);
    await expect(page.getByRole('heading', { name: 'Batches' })).toBeVisible();
  });

  test('staff can see customer-owned batch on batches page', async ({ page }) => {
    await login(page, adminEmail);
    await page.goto('/dashboard/batches');
    await expect(page.getByRole('heading', { name: 'Batches' })).toBeVisible();

    const ownLink = page.getByRole('link', { name: 'e2e-customer-own.edi' });
    await expect(ownLink).toBeVisible({ timeout: 15_000 });
    await ownLink.click();
    await expect(page).toHaveURL(/\/dashboard\/batches\/\d+/, { timeout: 15_000 });
    await expect(page.getByText('Run / check validation')).toBeVisible();
  });

  test('batch list shows server-side pagination metadata', async ({ page }) => {
    await login(page, customerEmail);
    await page.goto('/portal/batches');
    await expect(page.getByTestId('batch-pagination')).toContainText(/Page \d+ of \d+/);
  });
});
