import { test, expect } from '@playwright/test';
import { stubLabourForce } from './fixtures/labourForce.js';
import { figures, openDashboard, waitForFigures, cardFor } from './fixtures/charts.mjs';

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
  await stubLabourForce(page);
  await openDashboard(page, '/', { colorScheme: 'dark' });
  await waitForFigures(page);
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
      .map((el) => el.dataset.figure),
  );
  expect(offenders).toEqual([]);
});

// One test per figure, named and filed by figure id, for the reasons set out
// in figures.spec.mjs.
test.describe('each figure matches its dark baseline', () => {
  test('the dashboard shows every published figure', async ({ page }) => {
    expect(await page.locator('.stat-card').count()).toBe(figures.length);
  });

  for (const { id, title } of figures) {
    test(`${id} — ${title}`, async ({ page }) => {
      await expect(cardFor(page, id)).toHaveScreenshot(`${id}.png`);
    });
  }
});
