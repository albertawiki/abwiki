import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import labourForce from './fixtures/labourForce.js';
import { topics, catalogue } from '../src/figures/catalogue.mjs';

const { stubLabourForce } = labourForce;

/**
 * Accessibility, checked against WCAG 2.2 Level AA.
 *
 * Alberta has no accessibility legislation covering web content, and the
 * province's own accessibility page names no WCAG version or conformance
 * level. There is therefore no standard to inherit, so this project picks the
 * strongest current one: WCAG 2.2 AA is the W3C Recommendation and supersedes
 * the 2.1 AA that every other Canadian jurisdiction's legislation references.
 *
 * An automated scan finds perhaps a third of WCAG failures. It cannot judge
 * whether a chart's description is useful or whether a reading order makes
 * sense, so the checks below it are the ones a scanner cannot do: focus that
 * stays visible, a heading outline with no gaps, and every control reachable
 * and named.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const ROUTES = [
  '/',
  ...topics.map((t) => `/${t.slug}`),
  `/f/${catalogue[0].id}`,
  '/contribute',
  '/faq',
  '/no-such-page',
];

async function open(page, path) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubLabourForce(page);
  await page.goto(path);
  await page.waitForFunction(() => document.fonts.status === 'loaded');
}

/** Readable one-line summaries, so a failure names the element and the rule. */
const describe = (violations) =>
  violations.flatMap((v) =>
    v.nodes.map((n) => `[${v.impact}] ${v.id}: ${n.target.join(' ')} — ${v.help}`));

for (const route of ROUTES) {
  test(`${route} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await open(page, route);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(describe(violations)).toEqual([]);
  });
}

test('the dashboard is clean in dark mode too', async ({ page }) => {
  // Dark is a separate palette rather than an inversion, so its contrast is a
  // separate question from the light palette's.
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await stubLabourForce(page);
  await page.goto('/');
  await page.waitForFunction(() => document.fonts.status === 'loaded');

  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(describe(violations)).toEqual([]);
});

test.describe('what a scanner cannot check', () => {
  test('every interactive control can be reached by keyboard and says what it is', async ({ page }) => {
    await open(page, '/');

    const unreachable = await page.evaluate(() => {
      const named = (el) => Boolean(
        el.textContent.trim()
        || el.getAttribute('aria-label')
        || el.getAttribute('title')
        || el.querySelector('img[alt]:not([alt=""])'),
      );
      const visible = (el) => el.offsetParent !== null;
      const name = (el) => `${el.tagName.toLowerCase()}.${el.className || '(no class)'}`;

      // Controls: must be in the tab order and must announce something.
      const controls = [...document.querySelectorAll('a[href], button, input, select, textarea')]
        .filter(visible)
        .filter((el) => el.tabIndex < 0 || !named(el));

      // Anything else given a tab stop has to be worth stopping on. A
      // tabindex of -1 is the correct way to keep a decorative element out of
      // the tab order, so it is not a fault: Recharts puts one on the empty
      // div it positions tooltips in.
      const stops = [...document.querySelectorAll('[tabindex]:not([tabindex="-1"])')]
        .filter(visible)
        .filter((el) => !named(el));

      return [...new Set([...controls, ...stops].map(name))];
    });

    expect(unreachable).toEqual([]);
  });

  test('focus stays visible as you tab through the page', async ({ page }) => {
    await open(page, '/');

    // A focus ring that renders as nothing is the most common way a keyboard
    // user loses their place, and no scanner reports it.
    const invisible = [];
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const ring = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
        const other = s.boxShadow !== 'none' || s.textDecorationLine.includes('underline');
        return {
          what: `${el.tagName.toLowerCase()}.${el.className || '(no class)'}`,
          visible: ring || other,
        };
      });
      if (focused && !focused.visible) invisible.push(focused.what);
    }

    expect([...new Set(invisible)]).toEqual([]);
  });

  test('headings descend without skipping a level', async ({ page }) => {
    for (const route of ['/', '/economy', `/f/${catalogue[0].id}`]) {
      await open(page, route);
      const gaps = await page.evaluate(() => {
        const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => Number(el.tagName[1]));
        const found = [];
        levels.forEach((level, i) => {
          if (i > 0 && level > levels[i - 1] + 1) found.push(`h${levels[i - 1]} then h${level}`);
        });
        return { first: levels[0], found };
      });
      expect(gaps.first, `${route}: first heading is not an h1`).toBe(1);
      expect(gaps.found, `${route}: heading level skipped`).toEqual([]);
    }
  });

  test('every chart is reachable as a table for anyone who cannot read it', async ({ page }) => {
    // The charts are SVG and convey their meaning visually. The data table
    // behind each one is the accessible equivalent, so every figure has to
    // offer it rather than only most of them.
    await open(page, '/');

    const withoutTable = await page.evaluate(() =>
      [...document.querySelectorAll('.stat-card')]
        .filter((card) => ![...card.querySelectorAll('button')]
          .some((b) => b.textContent.trim() === 'Data table'))
        .map((card) => card.querySelector('.stat-card-title')?.textContent?.trim()));

    expect(withoutTable).toEqual([]);
  });
});
