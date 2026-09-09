import { catalogue } from '../../src/figures/catalogue.mjs';

/**
 * Shared setup for the specs that photograph charts.
 *
 * Both the light and the dark spec need the same three things: the list of
 * figures that should be on the dashboard, a page with animation turned off,
 * and a wait that does not return until every chart has finished drawing.
 * They had their own copies, which drifted.
 */

/**
 * Every published figure, as `{ id, title }`.
 *
 * Read from the catalogue rather than written here, so adding a figure does
 * not leave these checks asserting an old, smaller number. Top-level await
 * is why these specs are `.mjs`: Playwright collects tests synchronously, so
 * generating one test per figure means having the list before collection.
 */
export const figures = catalogue.map(({ id, title }) => ({ id, title }));

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
export async function openDashboard(page, path = '/', media = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce', ...media });
  await page.goto(path);
}

/** Wait for the charts to have actually drawn before capturing anything. */
export async function waitForFigures(page, expected = figures.length) {
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

/**
 * The card for one figure.
 *
 * Addressed by `data-figure`, which is the figure's id, not by its visible
 * title. Ids are public URLs and a test enforces their shape, so they are
 * stable by policy; titles are copy and get rewritten.
 */
export const cardFor = (page, id) => page.locator(`.stat-card[data-figure="${id}"]`);
