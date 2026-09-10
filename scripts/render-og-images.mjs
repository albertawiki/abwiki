#!/usr/bin/env node
/**
 * Photograph every figure, and the site itself, into a 1200x630 social card.
 *
 * People share charts, not dashboards. Until this existed, a shared figure
 * link previewed as the site's logo whichever chart was shared, so the thing
 * that travelled carried none of the thing it was about — and the attribution
 * did not travel with it either, which is the whole argument for permalinks.
 *
 * Runs after the build, against the built site, using the browser that is
 * already in the toolchain for the visual review. `src/pages/OgCard.js` draws
 * a figure's card and `src/pages/DefaultOgCard.js` draws the one every other
 * page previews with; this only serves them, waits for them, and takes the
 * picture.
 *
 *   node scripts/render-og-images.mjs
 *
 * It is not part of `postbuild`, because that would put a chromium download in
 * the way of every local build. The deploy workflow runs it; a build without
 * it produces a site whose `og:image` tags point at images that are not there,
 * which is why the deploy verifies one of them serves.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import { catalogue } from '../src/figures/catalogue.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = join(here, '..', 'build');
const outDir = join(buildDir, 'og');

const PORT = Number(process.env.OG_PORT || 4174);
const ORIGIN = `http://127.0.0.1:${PORT}`;

// The canonical social-card size. Rendered at twice the density because the
// card is mostly type and a chart, and both look soft at 1x on a phone.
const WIDTH = 1200;
const HEIGHT = 630;
const DENSITY = 2;

// Long enough that a slow Statistics Canada still produces a live chart, and
// bounded so a hung one does not hold the deploy open. The fallback path has
// no network in it, so it needs far less.
const LIVE_TIMEOUT = 45_000;
const FALLBACK_TIMEOUT = 15_000;

// The default card has no network call in it at all — nothing to be generous
// about — so this is just "clearly broken" versus "still loading."
const STATIC_TIMEOUT = 15_000;

// The Labour Force Survey, which the two labour figures fetch on mount.
const STATCAN = '**/www150.statcan.gc.ca/t1/wds/**';

if (!existsSync(buildDir)) {
  console.error('No build directory. Run `npm run build` first.');
  process.exit(1);
}

/** Serve the built site, and resolve once it answers. */
async function serve() {
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['serve', '-s', buildDir, '-l', String(PORT)],
    { stdio: 'ignore', shell: process.platform === 'win32' },
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${ORIGIN}/`);
      if (response.ok) return child;
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  child.kill();
  throw new Error(`Nothing answered on ${ORIGIN} after 30 seconds.`);
}

/**
 * Wait until the card has finished drawing.
 *
 * Three conditions, and all three have caught a blank or half-drawn chart
 * before: the card is on the page at all, the fonts have loaded, and no line
 * is still being stroked. Recharts animates by shrinking a pixel dasharray to
 * 0px, so a px gap that is not yet zero means the draw is running — a
 * unitless pattern is a deliberately dashed series and is always fine.
 */
async function waitForCard(page, id, timeout) {
  await page.waitForSelector(`.og-card[data-og-ready="${id}"]`, { timeout });
  await page.waitForSelector('.recharts-surface', { timeout });
  await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout });
  await page.waitForFunction(
    () => [...document.querySelectorAll('.recharts-line-curve')].every((p) => {
      const dash = p.getAttribute('stroke-dasharray');
      if (!dash || !dash.includes('px')) return true;
      return /(^|\s)0px$/.test(dash.trim());
    }),
    null,
    { timeout },
  );
}

/**
 * Draw one card, live if the source cooperates and from the fallback if not.
 *
 * The two labour figures fetch the Labour Force Survey when they mount, and
 * while that is in flight they render a placeholder with no chart in it at all.
 * So a slow Statistics Canada used to fail the whole deploy: the wait for a
 * chart surface expired, the script exited non-zero, and the site did not
 * publish. Nothing about putting alberta.wiki on the internet should depend on
 * a third party answering inside fifteen seconds.
 *
 * The generous wait covers slow-but-working. Past that, the API is blocked and
 * the page reloaded, which drives the same fallback path a reader gets when the
 * survey is unreachable: real committed annual averages, drawn, with the
 * figure's own "live data is unavailable" warning visible on it. That is the
 * honest picture of a degraded site rather than a fabricated one — the fixture
 * the tests use would have been faster and would have put invented numbers on
 * a public card.
 */
async function drawCard(page, id) {
  await page.goto(`${ORIGIN}/og/${id}`, { waitUntil: 'load' });

  try {
    await waitForCard(page, id, LIVE_TIMEOUT);
    return 'live';
  } catch (error) {
    if (error.name !== 'TimeoutError') throw error;
  }

  await page.route(STATCAN, (route) => route.abort());
  await page.reload({ waitUntil: 'load' });
  await waitForCard(page, id, FALLBACK_TIMEOUT);
  await page.unroute(STATCAN);

  return 'fallback';
}

/**
 * Measure a rendered card for overflow, screenshot it, and report which box
 * (if any) has spilled past its edge.
 *
 * Shared between the default card and every figure card because the failure
 * mode is the same one either way: a box that is free to shrink gets squeezed
 * by a sibling that is not, and the result is still a perfectly valid PNG with
 * something cropped along an edge and nothing to say so.
 */
async function capture(page, id, innerSelector) {
  const overflow = await page.evaluate((selector) => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.scrollHeight - el.clientHeight : 0;
    };
    return { card: box('.og-card'), inner: box(selector) };
  }, innerSelector);

  await page.locator(`.og-card[data-og-ready="${id}"]`).screenshot({
    path: join(outDir, `${id}.png`),
    scale: 'device',
  });

  return overflow;
}

const server = await serve();
let browser;

const overflowed = [];
const clipped = [];
const degraded = [];

try {
  // Clear rather than overwrite, so a figure that has been removed does not
  // leave an image behind for a link somebody still has.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: DENSITY,
    // The card pins its own palette, but ask for light anyway: the two
    // disagreeing would mean the build machine's preference decided what
    // everyone sees.
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });

  const page = await context.newPage();

  // The default card first. It has no chart and no live data, so there is
  // nothing to wait for beyond the card existing and its fonts being ready.
  await page.goto(`${ORIGIN}/og/default`, { waitUntil: 'load' });
  await page.waitForSelector('.og-card[data-og-ready="default"]', { timeout: STATIC_TIMEOUT });
  await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: STATIC_TIMEOUT });

  const defaultOverflow = await capture(page, 'default', '.og-card-default');
  if (defaultOverflow.card > 1) overflowed.push(`default (card by ${defaultOverflow.card}px)`);

  for (const figure of catalogue) {
    if (await drawCard(page, figure.id) === 'fallback') degraded.push(figure.id);

    // The card is a fixed 1200x630 and its contents are not, so a longer title
    // or a legend on a third row pushes something past the bottom edge. The
    // screenshot would still be written, with a chart cropped along its
    // baseline and nothing to say so — this is what says so.
    //
    // The chart's box is measured as well as the card's, and it is the one
    // that catches this. The chart declares a height in pixels while its box
    // is a flex item free to shrink, so a tall title squeezes the box and the
    // chart spills out of it; the card's own height never changes and its
    // overflow stays zero. The first version of this check measured only the
    // card and passed a card whose legend was sitting on the source rule.
    const overflow = await capture(page, figure.id, '.og-card-figure');

    if (overflow.card > 1) overflowed.push(`${figure.id} (card by ${overflow.card}px)`);
    if (overflow.inner > 1) clipped.push(`${figure.id} (chart by ${overflow.inner}px)`);
  }
} finally {
  await browser?.close();
  server.kill();
}

if (overflowed.length > 0 || clipped.length > 0) {
  console.error('\nThese social cards do not fit the space they are drawn in:');
  overflowed.forEach((line) => console.error(`  overflows the card: ${line}`));
  clipped.forEach((line) => console.error(`  chart runs past its box: ${line}`));
  console.error(
    '\nThe card is a fixed 1200x630. Either the title is too long for two lines'
    + '\nat 2.5rem, or the chart has grown a row of legend it did not have.'
    + '\nThe height budget is written out beside .og-card-title in src/App.css.',
  );
  process.exit(1);
}

// Verify rather than assume. A missing card is exactly the failure this
// script exists to fix, and an empty directory looks like success from here.
const written = readdirSync(outDir).filter((f) => f.endsWith('.png'));
const expected = ['default', ...catalogue.map((f) => f.id)];
const missing = expected.filter((id) => !written.includes(`${id}.png`));

if (missing.length > 0) {
  console.error(`\nNo social card was written for: ${missing.join(', ')}`);
  process.exit(1);
}

// A card that renders as an empty frame still writes a valid PNG, and a blank
// 1200x630 compresses to almost nothing. Anything this small is not a chart.
const MIN_BYTES = 12_000;
const suspicious = written
  .map((file) => ({ file, bytes: statSync(join(outDir, file)).size }))
  .filter(({ bytes }) => bytes < MIN_BYTES);

if (suspicious.length > 0) {
  console.error('\nThese social cards are too small to contain a chart:');
  suspicious.forEach(({ file, bytes }) => console.error(`  ${file} (${bytes} bytes)`));
  process.exit(1);
}

console.log(`Rendered ${written.length} social cards at ${WIDTH * DENSITY}x${HEIGHT * DENSITY}.`);

// Not a failure. The card is real committed data carrying the figure's own
// warning, which is what a reader sees when the survey is down too. Worth
// saying out loud so that a source outage is visible in the deploy log rather
// than only in the picture.
if (degraded.length > 0) {
  console.log(
    `
${degraded.length} card(s) drew the committed fallback because the live source`
    + ` did not answer in ${LIVE_TIMEOUT / 1000}s: ${degraded.join(', ')}`,
  );
}
