import { test, expect } from '@playwright/test';
import { stubLabourForce, breakLabourForce } from './fixtures/labourForce.js';
import { figures, openDashboard, waitForFigures, cardFor } from './fixtures/charts.mjs';

/**
 * Visual review of every published figure.
 *
 * One screenshot per card rather than one per page: a whole-page baseline
 * fails on any change anywhere, which trains reviewers to approve diffs
 * without reading them. Per-figure baselines mean a diff names the chart that
 * changed, and an unrelated copy edit does not touch it.
 */

test.describe('dashboard figures', () => {
  test.beforeEach(async ({ page }) => {
    await stubLabourForce(page);
    await openDashboard(page);
    await waitForFigures(page);
  });

  test('every card renders a chart with marks in it', async ({ page }) => {
    const cards = page.locator('.stat-card');
    expect(await cards.count()).toBe(figures.length);

    for (const { id, title } of figures) {
      const card = cardFor(page, id);
      await expect(card, `no card is published at "${id}"`).toHaveCount(1);

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
          figure: el.dataset.figure,
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
});

/**
 * Baselines, one test per figure.
 *
 * Generated rather than looped, for two reasons. A loop stops at the first
 * mismatch, so a run that should have reported six changed charts reports one
 * and hides the rest until it is fixed and re-run. And a generated test is
 * named for the figure, so the report says which chart moved without anyone
 * opening a trace.
 *
 * The file each one writes is named for the figure's id. It used to be named
 * for the slugified visible title, which meant retitling a figure orphaned its
 * baseline: the old file stayed behind, the new name read as a missing
 * snapshot, and the next `--update-snapshots` accepted whatever was on screen
 * with nobody comparing anything. Retitling sixteen figures at once left
 * thirty-four baselines for seventeen charts. Ids are public URLs and a test
 * enforces their shape, so they are stable in a way copy is not.
 */
test.describe('each figure matches its baseline', () => {
  test.beforeEach(async ({ page }) => {
    await stubLabourForce(page);
    await openDashboard(page);
    await waitForFigures(page);
  });

  for (const { id, title } of figures) {
    test(`${id} — ${title}`, async ({ page }) => {
      await expect(cardFor(page, id)).toHaveScreenshot(`${id}.png`);
    });
  }
});

test.describe('provenance is reachable', () => {
  test.beforeEach(async ({ page }) => {
    await stubLabourForce(page);
    await openDashboard(page);
    await waitForFigures(page);
  });

  test('sources open and every link is a real https source', async ({ page }) => {
    for (const { id, title } of figures) {
      const card = cardFor(page, id);

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
    const card = cardFor(page, 'er-wait-time-physician-assessment');
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
  test('the labour charts fall back and say so', async ({ page }) => {
    await breakLabourForce(page);
    await openDashboard(page);

    // Both labour figures read the same source, so a failure has to be visible
    // on each of them. The point is that they degrade visibly rather than
    // rendering an empty frame, which is what the retired endpoint did in
    // production.
    for (const id of ['employment-rate', 'unemployment-rate']) {
      const card = cardFor(page, id);
      await expect(card.locator('.chart-warning')).toContainText(
        'Live data from Statistics Canada is unavailable',
      );
      expect(await card.locator('.recharts-line-curve').count()).toBeGreaterThan(0);
    }
  });
});
