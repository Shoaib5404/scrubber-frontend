import { test, expect } from '@playwright/test';

test('home loads with API health status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Neo Scrubber' })).toBeVisible();
  await expect(
    page.getByText(/API ok|API unavailable/, { exact: false }),
  ).toBeVisible({ timeout: 15_000 });
});
