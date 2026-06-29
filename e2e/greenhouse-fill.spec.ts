import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../dist');
const FIXTURE_URL = `file://${path.resolve(__dirname, '../src/__fixtures__/greenhouse-form.html')}`;

test.describe('Ghost Interface — Greenhouse golden path', () => {
  test('pill appears on form page', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    const page = await context.newPage();
    await page.goto(FIXTURE_URL);
    await page.waitForTimeout(1500);

    // Ghost pill should mount inside shadow DOM
    const pill = page.locator('#ghost-interface-host').locator('pierce/[data-ghost="pill"]');
    await expect(pill).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
