import { test, expect } from '@playwright/test';
import labourForce from './fixtures/labourForce.js';
import { topics, catalogue } from '../src/figures/catalogue.mjs';

// The fixture is CommonJS, so it arrives as a default export here.
const { stubLabourForce } = labourForce;

/**
 * Topic pages and figure permalinks, in a real browser.
 *
 * The jsdom tests already check which figures each route lists. What they
 * cannot check is that the charts on those routes actually draw: jsdom has no
 * layout engine, so a topic page could render fourteen empty frames and pass.
 */

async function open(page, path) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubLabourForce(page);
  await page.goto(path);
}

/** Every card on the page has drawn marks inside it. */
async function expectChartsDrawn(page) {
  const cards = page.locator('.stat-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const title = await card.locator('.stat-card-title').innerText();
    const marks = card.locator(
      '.recharts-line-curve, .recharts-bar-rectangle, .recharts-area-area',
    );
    await expect(marks.first(), `"${title}" drew no marks`).toBeAttached();
  }
}

for (const topic of topics) {
  test.describe(`the /${topic.slug} page`, () => {
    test('draws every chart it lists, and only its own', async ({ page }) => {
      await open(page, `/${topic.slug}`);

      await expect(page.getByRole('heading', { level: 1, name: topic.label })).toBeVisible();

      const expected = catalogue.filter((f) => f.topic === topic.slug).length;
      await expect(page.locator('.stat-card')).toHaveCount(expected);

      await expectChartsDrawn(page);
    });

    test('does not scroll sideways', async ({ page }) => {
      await open(page, `/${topic.slug}`);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });
}

test.describe('a figure permalink', () => {
  test('draws the figure and shows its caveats without a click', async ({ page }) => {
    const figure = catalogue.find((f) => f.topic === 'healthcare');
    await open(page, `/f/${figure.id}`);

    await expect(page.locator('.stat-card')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'How to read this' })).toBeVisible();
    await expectChartsDrawn(page);
  });

  test('reaches every published figure', async ({ page }) => {
    // A permalink that 404s is worse than no permalink: it is a link somebody
    // shared that now says the figure does not exist.
    for (const { id } of catalogue) {
      await open(page, `/f/${id}`);
      await expect(page.locator('.stat-card')).toHaveCount(1);
      await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0);
    }
  });
});

test.describe('an address with nothing at it', () => {
  test('says so rather than rendering a blank page', async ({ page }) => {
    await open(page, '/f/no-such-figure');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  });
});
