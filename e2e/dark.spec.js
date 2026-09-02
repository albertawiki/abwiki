const { test, expect } = require('@playwright/test');
const { employmentRateResponse } = require('./fixtures/employmentRate');

/**
 * Dark mode, as its own baseline.
 *
 * Dark is a selected palette rather than an inversion of the light one, so it
 * can regress independently — a token added to only one of the two blocks,
 * or a colour hardcoded in a component, shows up here and nowhere else.
 *
 * This project drives dark through the operating-system preference rather
 * than the toggle, because that is how most readers who want it will arrive.
 */
test.beforeEach(async ({ page }) => {
  await page.route('**/api.economicdata.alberta.ca/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(employmentRateResponse),
    }),
  );
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/');
  await page.waitForFunction(
    () => document.querySelectorAll('.recharts-surface').length >= 10,
    null,
    { timeout: 15_000 },
  );
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForFunction(
    () => [...document.querySelectorAll('.recharts-line-curve')].every((p) => {
      const dash = p.getAttribute('stroke-dasharray');
      if (!dash || !dash.includes('px')) return true;
      return /(^|\s)0px$/.test(dash.trim());
    }),
  );
});

test('the dark palette is actually applied', async ({ page }) => {
  const applied = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const line = document.querySelector('.recharts-line-curve');
    return {
      page: getComputedStyle(document.body).backgroundColor,
      series1: root.getPropertyValue('--series-1').trim(),
      lineStroke: getComputedStyle(line).stroke,
    };
  });

  // The dark steps, not the light ones. #3987e5 is the blue validated against
  // the dark card; #2a78d6 is the light one and must not appear here.
  expect(applied.series1).toBe('#3987e5');
  expect(applied.lineStroke).toBe('rgb(57, 135, 229)');
  expect(applied.page).toBe('rgb(13, 13, 13)');
});

test('no figure overflows its card in dark mode', async ({ page }) => {
  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll('.stat-card')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.querySelector('.stat-card-title')?.textContent),
  );
  expect(offenders).toEqual([]);
});

test('each figure matches its dark baseline', async ({ page }) => {
  const cards = page.locator('.stat-card');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(10);

  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const id = (await card.locator('.stat-card-title').innerText())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    await expect(card).toHaveScreenshot(`${id}.png`);
  }
});
