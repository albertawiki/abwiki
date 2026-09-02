const { test, expect } = require('@playwright/test');
const { employmentRateResponse } = require('./fixtures/employmentRate');

const EMPLOYMENT_API = '**/api.economicdata.alberta.ca/**';

/** Serve the employment chart a fixed response so the page is deterministic. */
async function stubEmploymentApi(page) {
  await page.route(EMPLOYMENT_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(employmentRateResponse),
    }),
  );
}

/**
 * Visual review of every published figure.
 *
 * One screenshot per card rather than one per page: a whole-page baseline
 * fails on any change anywhere, which trains reviewers to approve diffs
 * without reading them. Per-figure baselines mean a diff names the chart that
 * changed, and an unrelated copy edit does not touch it.
 */

/**
 * Turn off chart animation for the page, then load it.
 *
 * The figures disable their mount animation under prefers-reduced-motion, so
 * setting the preference makes a screenshot capture the finished chart rather
 * than a frame of it being drawn. This has to be an explicit emulateMedia call
 * before goto: the config-level reducedMotion option does not reach the page
 * here, and without it Recharts leaves a partial stroke-dasharray on every
 * line, so baselines record dashed lines that no reader ever sees.
 */
async function openDashboard(page, path = '/') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
}

/** Wait for the charts to have actually drawn before capturing anything. */
async function waitForFigures(page, expected) {
  await page.waitForFunction(
    (n) => document.querySelectorAll('.recharts-surface').length >= n,
    expected,
    { timeout: 15_000 },
  );
  await page.waitForFunction(
    () => document.fonts.status === 'loaded',
    null,
    { timeout: 15_000 },
  );
  // Belt and braces: no line may still be part-way through being stroked.
  // Recharts animates by setting a pixel dasharray whose gap shrinks to 0px,
  // so a px-valued gap that is not yet 0 means the draw is still running. A
  // unitless pattern like "5 3" is a deliberate dashed series (the 2023-base
  // poverty line) and is always fine.
  await page.waitForFunction(
    () => [...document.querySelectorAll('.recharts-line-curve')].every((p) => {
      const dash = p.getAttribute('stroke-dasharray');
      if (!dash || !dash.includes('px')) return true;
      return /(^|\s)0px$/.test(dash.trim());
    }),
    null,
    { timeout: 15_000 },
  );
}

test.describe('dashboard figures', () => {
  test.beforeEach(async ({ page }) => {
    await stubEmploymentApi(page);
    await openDashboard(page);
    await waitForFigures(page, 10);
  });

  test('every card renders a chart with marks in it', async ({ page }) => {
    const cards = page.locator('.stat-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(10);

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const title = await card.locator('.stat-card-title').innerText();

      // A figure that draws no marks is the failure this whole harness exists
      // to catch — it is what the live employment chart was doing for months.
      const marks = card.locator(
        '.recharts-line-curve, .recharts-bar-rectangle, .recharts-area-area',
      );
      expect(await marks.count(), `"${title}" drew no marks`).toBeGreaterThan(0);

      // And an axis with real ticks, so a chart cannot pass by drawing a line
      // against no scale.
      const ticks = card.locator('.recharts-cartesian-axis-tick-value');
      expect(await ticks.count(), `"${title}" has no axis labels`).toBeGreaterThan(2);
    }
  });

  test('no figure overflows its card', async ({ page }) => {
    // The mobile project makes this meaningful: a chart measured at desktop
    // width that fails to shrink pushes the page into a horizontal scroll.
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll('.stat-card')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => ({
          title: el.querySelector('.stat-card-title')?.textContent,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        })),
    );
    expect(offenders).toEqual([]);
  });

  test('the page never scrolls sideways', async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('each figure matches its baseline', async ({ page }) => {
    const cards = page.locator('.stat-card');
    const count = await cards.count();

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const id = (await card.locator('.stat-card-title').innerText())
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      await expect(card).toHaveScreenshot(`${id}.png`);
    }
  });
});

test.describe('provenance is reachable', () => {
  test('sources open and every link is a real https source', async ({ page }) => {
    await stubEmploymentApi(page);
    await openDashboard(page);
    await waitForFigures(page, 10);

    const cards = page.locator('.stat-card');
    const count = await cards.count();

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const title = await card.locator('.stat-card-title').innerText();

      await card.getByRole('button', { name: 'Sources' }).click();
      const links = card.locator('.stat-card-panel a');

      const n = await links.count();
      expect(n, `"${title}" listed no sources`).toBeGreaterThan(0);

      for (let j = 0; j < n; j += 1) {
        expect(await links.nth(j).getAttribute('href')).toMatch(/^https:\/\//);
      }

      await card.getByRole('button', { name: 'Sources' }).click();
    }
  });

  test('the data table shows the numbers behind the chart', async ({ page }) => {
    await stubEmploymentApi(page);
    await openDashboard(page);
    await waitForFigures(page, 10);

    const card = page.locator('.stat-card', {
      hasText: 'Emergency department wait to see a doctor',
    });
    await card.getByRole('button', { name: 'Data table' }).click();

    const table = card.locator('table.data-table');
    await expect(table).toBeVisible();
    await expect(table.getByText('2024-25')).toBeVisible();
    await expect(table.getByText('7', { exact: true })).toBeVisible();
  });
});

test.describe('pages', () => {
  for (const [path, heading] of [
    ['/', 'alberta.wiki'],
    ['/contribute', 'Contribute'],
    ['/faq', 'Frequently asked questions'],
  ]) {
    test(`${path} renders and titles itself`, async ({ page }) => {
      await openDashboard(page, path);
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(/alberta\.wiki/);
    });
  }
});

test.describe('when a live source is unreachable', () => {
  test('the employment chart falls back and says so', async ({ page }) => {
    await page.route(EMPLOYMENT_API, (route) => route.fulfill({ status: 500, body: '' }));
    await openDashboard(page);

    const card = page.locator('.stat-card', { hasText: 'Employment rate' });

    // The point is that it degrades visibly rather than rendering an empty
    // frame, which is what the retired endpoint did in production.
    await expect(card.locator('.chart-warning')).toContainText(
      'Live data from the Alberta Economic Dashboard is unavailable',
    );
    expect(await card.locator('.recharts-line-curve').count()).toBeGreaterThan(0);
  });
});
