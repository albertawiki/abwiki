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
 *
 * Figure pages also get schema.org `Dataset` markup, which is what puts a
 * chart into a dataset search. Structured data has to be in the served
 * document for the same reason the Open Graph tags do, and it is built from
 * the app's own `dataset()` records rather than a transcription of them —
 * see scripts/lib/app-modules.mjs for how a build script reads those.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';

import { routes, metaForRoute, SITE_ORIGIN, catalogue } from '../src/figures/catalogue.mjs';
import { datasetJsonLdText } from '../src/figures/structuredData.mjs';

register('./lib/app-modules.mjs', import.meta.url);
const { datasets } = await import('../src/data/index.js');

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

const datasetById = new Map(datasets.map((d) => [d.meta.id, d]));

/**
 * The `Dataset` script for a route, or '' if the route is not a figure.
 *
 * `</` inside a script element ends it, wherever it appears — a source title
 * containing one would otherwise close the tag early and spill JSON into the
 * document. Escaping the slash keeps the JSON identical to a parser and inert
 * to the HTML tokeniser.
 */
function structuredData(path) {
  const figure = catalogue.find((f) => `/f/${f.id}` === path);
  if (!figure) return '';

  const bound = datasetById.get(figure.dataset ?? figure.id);
  if (!bound) {
    console.error(`\n${figure.id} names a dataset that is not registered: ${figure.dataset ?? figure.id}`);
    process.exit(1);
  }

  const json = datasetJsonLdText(figure, bound.meta, bound.rows).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json" data-figure="${attr(figure.id)}">${json}</script>`;
}

/**
 * Replace the shell's head tags with this route's.
 *
 * The shell already carries a title and a description, written by
 * public/index.html, so these are substitutions rather than insertions. Anything
 * appended instead would leave two of each and let a scraper pick either.
 */
function render(path) {
  const { title, description, canonical, image } = metaForRoute(path);

  const social = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="alberta.wiki">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:url" content="${attr(canonical)}">`,
    `<meta property="og:image" content="${attr(image.url)}">`,
    ...(image.width
      ? [
        `<meta property="og:image:width" content="${image.width}">`,
        `<meta property="og:image:height" content="${image.height}">`,
      ]
      : []),
    ...(image.alt ? [`<meta property="og:image:alt" content="${attr(image.alt)}">`] : []),
    `<meta name="twitter:card" content="${image.card}">`,
    `<meta name="twitter:title" content="${attr(title)}">`,
    `<meta name="twitter:description" content="${attr(description)}">`,
    `<meta name="twitter:image" content="${attr(image.url)}">`,
    `<link rel="canonical" href="${attr(canonical)}">`,
  ].join('');

  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`);

  const descriptionTag = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/;
  if (!descriptionTag.test(html)) {
    throw new Error('index.html has no description meta tag to replace');
  }
  html = html.replace(
    descriptionTag,
    `<meta name="description" content="${attr(description)}">${social}${structuredData(path)}`,
  );

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

// Same reasoning as the titles: assert the markup landed rather than trusting
// the substitution, since a silent miss looks exactly like success.
const withData = routes().filter((path) =>
  readFileSync(join(buildDir, fileFor(path)), 'utf8').includes('application/ld+json'));

if (withData.length !== catalogue.length) {
  console.error(`\n${withData.length} routes carry Dataset markup; ${catalogue.length} figures exist.`);
  process.exit(1);
}

console.log(
  `Prerendered ${written.length} routes, ${distinct} distinct titles, `
  + `${withData.length} with Dataset markup.`,
);
