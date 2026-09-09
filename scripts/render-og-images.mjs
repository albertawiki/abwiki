#!/usr/bin/env node
/**
 * Photograph every figure into a 1200x630 social card.
 *
 * People share charts, not dashboards. Until this existed, a shared figure
 * link previewed as the site's logo whichever chart was shared, so the thing
 * that travelled carried none of the thing it was about — and the attribution
 * did not travel with it either, which is the whole argument for permalinks.
 *
 * Runs after the build, against the built site, using the browser that is
 * already in the toolchain for the visual review. `src/pages/OgCard.js` draws
 * the card; this only serves it, waits for it, and takes the picture.
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
async function waitForCard(page, id) {
  await page.waitForSelector(`.og-card[data-og-ready="${id}"]`, { timeout: 15_000 });
  await page.waitForSelector('.recharts-surface', { timeout: 15_000 });
  await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 15_000 });
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

const server = await serve();
let browser;

const overflowed = [];
const clipped = [];

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

  for (const figure of catalogue) {
    await page.goto(`${ORIGIN}/og/${figure.id}`, { waitUntil: 'load' });
    await waitForCard(page, figure.id);

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
    const overflow = await page.evaluate(() => {
      const box = (selector) => {
        const el = document.querySelector(selector);
        return el.scrollHeight - el.clientHeight;
      };
      return { card: box('.og-card'), figure: box('.og-card-figure') };
    });

    if (overflow.card > 1) overflowed.push(`${figure.id} (card by ${overflow.card}px)`);
    if (overflow.figure > 1) clipped.push(`${figure.id} (chart by ${overflow.figure}px)`);

    await page.locator(`.og-card[data-og-ready="${figure.id}"]`).screenshot({
      path: join(outDir, `${figure.id}.png`),
      scale: 'device',
    });
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
const missing = catalogue.filter((f) => !written.includes(`${f.id}.png`)).map((f) => f.id);

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
