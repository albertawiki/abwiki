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

/**
 * Every route sits in the same column.
 *
 * The topic pages shipped flush against the viewport edge, because the gutters
 * lived on the dashboard's own class rather than on the element that wraps the
 * router. This checks the frame on each route instead of trusting whoever adds
 * the next page to remember it.
 *
 * The mobile project is what enforces this. On a desktop viewport the column's
 * max-width centres the content and supplies a gutter whether or not any
 * padding exists, so removing the padding entirely still passes at 1280px and
 * fails on a phone. Deleting the mobile project would leave this test looking
 * green while checking nothing.
 */
test.describe('the featured figure on the home page', () => {
  test('draws a real chart and links to the figure and its topic', async ({ page }) => {
    await open(page, '/');

    const hero = page.locator('.featured');
    await expect(hero).toBeVisible();

    // The jsdom tests cover the rotation. What they cannot check is that the
    // chart inside the hero actually draws, because jsdom has no layout.
    const marks = hero.locator(
      '.recharts-line-curve, .recharts-bar-rectangle, .recharts-area-area',
    );
    await expect(marks.first()).toBeAttached();

    await expect(hero.getByRole('link', { name: /See this figure/ })).toBeVisible();
  });

  test('does not rotate when the reader has asked for reduced motion', async ({ page }) => {
    // open() already sets reducedMotion: 'reduce'.
    await open(page, '/');

    const title = page.locator('.featured-title');
    const before = await title.innerText();

    await page.waitForTimeout(9000);
    expect(await title.innerText()).toBe(before);

    // Nothing rotates, so nothing offers to pause.
    await expect(page.getByRole('button', { name: /rotating figures/ })).toHaveCount(0);
  });
});

test.describe('page gutters', () => {
  const ROUTES = ['/', ...topics.map((t) => `/${t.slug}`), `/f/${catalogue[0].id}`,
    '/contribute', '/faq', '/no-such-page'];

  for (const route of ROUTES) {
    test(`${route} keeps its content off the viewport edge`, async ({ page }) => {
      await open(page, route);

      const gaps = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const measure = (el) => {
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return Math.min(Math.round(b.left), Math.round(docW - b.right));
        };
        return {
          heading: measure(document.querySelector('h1')),
          crumb: measure(document.querySelector('.breadcrumb')),
          main: measure(document.querySelector('.main-content, .prose')),
        };
      });

      for (const [what, gap] of Object.entries(gaps)) {
        if (gap === null) continue;
        expect(gap, `${route}: ${what} sits ${gap}px from the edge`).toBeGreaterThanOrEqual(16);
      }
    });
  }
});

test.describe('an address with nothing at it', () => {
  test('says so rather than rendering a blank page', async ({ page }) => {
    await open(page, '/f/no-such-figure');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  });
});

/**
 * schema.org `Dataset` markup, in the document as served.
 *
 * The prerender step already asserts it wrote the script; this asserts a
 * browser can find and parse it, and — the part the build step cannot see —
 * that clicking through to a second figure replaces the first figure's markup
 * rather than leaving it, or adding a second one beside it. A page describing
 * itself as the wrong dataset is worse than one that says nothing.
 */
test.describe('structured data', () => {
  const ld = (page) =>
    page.locator('script[type="application/ld+json"][data-figure]');

  test('a figure page is served describing itself as a Dataset', async ({ page }) => {
    const [figure] = catalogue;
    await open(page, `/f/${figure.id}`);

    await expect(ld(page)).toHaveCount(1);
    const node = JSON.parse(await ld(page).innerText());

    expect(node['@type']).toBe('Dataset');
    expect(node.name).toBe(figure.title);
    expect(node.url).toBe(`https://alberta.wiki/f/${figure.id}`);
    expect(node.citation.length).toBeGreaterThan(0);
  });

  test('following a link to another figure replaces it', async ({ page }) => {
    const [first] = catalogue;
    await open(page, `/f/${first.id}`);
    await expect(ld(page)).toHaveCount(1);

    // The list, not the heading above it: the heading links to the topic page,
    // which is not a figure and correctly carries no markup at all.
    await page.locator('.figure-siblings ul a').first().click();
    await expect(page).toHaveURL(/\/f\/[a-z0-9-]+$/);
    await expect(page).not.toHaveURL(new RegExp(`/f/${first.id}$`));

    await expect(ld(page)).toHaveCount(1);
    const node = JSON.parse(await ld(page).innerText());
    expect(node.url).toBe(`https://alberta.wiki${new URL(page.url()).pathname}`);
  });

  test('leaving a figure page takes it with you', async ({ page }) => {
    await open(page, `/f/${catalogue[0].id}`);
    await expect(ld(page)).toHaveCount(1);

    await page.locator('.figure-siblings a').first().click();
    await expect(page).toHaveURL(/\/[a-z-]+$/);
    await expect(ld(page)).toHaveCount(0);
  });

  test('a page that is not a figure carries none', async ({ page }) => {
    await open(page, '/');
    await expect(ld(page)).toHaveCount(0);

    await open(page, `/${topics[0].slug}`);
    await expect(ld(page)).toHaveCount(0);
  });
});
