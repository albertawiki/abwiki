#!/usr/bin/env node
/**
 * Write one HTML file per route, with that route's own metadata already in it.
 *
 * The site is a client-rendered React app, so every URL used to serve the same
 * index.html and every title, description, canonical and Open Graph tag was
 * applied by JavaScript after load. Google runs JavaScript. Facebook, LinkedIn,
 * Slack, Discord, iMessage and X do not, so every shared figure link previewed
 * as the site's generic title with no image, whichever chart was shared. The
 * permalinks exist so a chart travelling on its own carries its source and its
 * URL, and at the first hop they were not doing it.
 *
 * This does not replace the client-side hook. React still sets the same values
 * on navigation, because a single-page app changing route does not re-fetch the
 * document. Both read `metaForRoute`, and a test asserts they agree.
 *
 * Routes have no file extension, so the deploy has to upload these objects with
 * an explicit `text/html` content type. See docs/DEPLOYMENT.md.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { routes, metaForRoute, SITE_ORIGIN } from '../src/figures/catalogue.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = join(here, '..', 'build');

if (!existsSync(buildDir)) {
  console.error('No build directory. Run `npm run build` first.');
  process.exit(1);
}

const shell = readFileSync(join(buildDir, 'index.html'), 'utf8');

/** Escape for an HTML attribute. */
const attr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SOCIAL_IMAGE = `${SITE_ORIGIN}/logo512.png`;

/**
 * Replace the shell's head tags with this route's.
 *
 * The shell already carries a title and a description, written by
 * public/index.html, so these are substitutions rather than insertions. Anything
 * appended instead would leave two of each and let a scraper pick either.
 */
function render(path) {
  const { title, description, canonical } = metaForRoute(path);
  const social = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="alberta.wiki">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:url" content="${attr(canonical)}">`,
    `<meta property="og:image" content="${attr(SOCIAL_IMAGE)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${attr(title)}">`,
    `<meta name="twitter:description" content="${attr(description)}">`,
    `<meta name="twitter:image" content="${attr(SOCIAL_IMAGE)}">`,
    `<link rel="canonical" href="${attr(canonical)}">`,
  ].join('');

  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`);

  const descriptionTag = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/;
  if (!descriptionTag.test(html)) {
    throw new Error('index.html has no description meta tag to replace');
  }
  html = html.replace(descriptionTag, `<meta name="description" content="${attr(description)}">${social}`);

  return html;
}

/** Where a route's file goes. "/" is index.html; the rest are extensionless. */
const fileFor = (path) => (path === '/' ? 'index.html' : path.replace(/^\//, ''));

const written = [];
for (const path of routes()) {
  const target = join(buildDir, fileFor(path));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, render(path), 'utf8');
  written.push(fileFor(path));
}

// Verify rather than assume: the failure this fixes was every route serving
// identical HTML, so check that they no longer do.
const titles = new Map();
for (const path of routes()) {
  const html = readFileSync(join(buildDir, fileFor(path)), 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const expected = attr(metaForRoute(path).title);
  if (title !== expected) {
    console.error(`\n${path} carries the wrong title.\n  got:      ${title}\n  expected: ${expected}`);
    process.exit(1);
  }
  titles.set(path, title);
}

const distinct = new Set(titles.values()).size;
if (distinct < 3) {
  console.error(`\nOnly ${distinct} distinct titles across ${titles.size} routes. The routes are still identical.`);
  process.exit(1);
}

console.log(`Prerendered ${written.length} routes, ${distinct} distinct titles.`);
