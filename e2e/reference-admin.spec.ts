import { test, expect } from '@playwright/test';

const adminEmail = 'e2e-admin@example.com';
const password = 'Password123!';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('reference admin', () => {
  test('staff can open CPT codes reference domain', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'References' }).click();
    await expect(page).toHaveURL(/\/dashboard\/references$/);
    await expect(page.getByRole('heading', { name: 'Reference data' })).toBeVisible();

    await page.getByTestId('reference-domain-link-cpt-codes').click();
    await expect(page).toHaveURL(/\/dashboard\/references\/cpt-codes/);
    await expect(page.getByRole('heading', { name: 'CPT Codes' })).toBeVisible();

    const table = page.getByTestId('reference-records-table');
    const empty = page.getByText('No records match your filters.');
    await expect(table.or(empty)).toBeVisible({ timeout: 15_000 });
  });

  test('staff can open Wave B NDC codes domain', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'References' }).click();
    await page.getByTestId('reference-domain-link-ndc-codes').click();
    await expect(page).toHaveURL(/\/dashboard\/references\/ndc-codes/);
    await expect(page.getByRole('heading', { name: 'NDC Codes' })).toBeVisible();

    const table = page.getByTestId('reference-records-table');
    const empty = page.getByText('No records match your filters.');
    await expect(table.or(empty)).toBeVisible({ timeout: 15_000 });
  });

  test('staff can open Wave C taxonomy codes domain', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'References' }).click();
    await page.getByTestId('reference-domain-link-taxonomy-codes').click();
    await expect(page).toHaveURL(/\/dashboard\/references\/taxonomy-codes/);
    await expect(page.getByRole('heading', { name: 'Taxonomy Codes' })).toBeVisible();

    const table = page.getByTestId('reference-records-table');
    const empty = page.getByText('No records match your filters.');
    await expect(table.or(empty)).toBeVisible({ timeout: 15_000 });
  });

  test('staff can open Wave D articles domain', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'References' }).click();
    await page.getByTestId('reference-domain-link-articles').click();
    await expect(page).toHaveURL(/\/dashboard\/references\/articles/);
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();

    const table = page.getByTestId('reference-records-table');
    const empty = page.getByText('No records match your filters.');
    await expect(table.or(empty)).toBeVisible({ timeout: 15_000 });
  });
});
