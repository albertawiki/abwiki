#!/usr/bin/env node
/**
 * Write build/sitemap.xml from the figure catalogue.
 *
 * Runs as a postbuild step, so the sitemap is derived from the same list the
 * site renders rather than maintained beside it. A figure added to the
 * catalogue is in the sitemap on the next build; one removed is gone from it.
 *
 * Every page is a client-side route served by the same index.html, so search
 * engines have no way to discover a permalink by crawling — nothing links to
 * most of them from outside. This file is that way.
 */

import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_ORIGIN, routes } from '../src/figures/catalogue.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = join(here, '..', 'build');

if (!existsSync(buildDir)) {
  console.error('No build directory. Run `npm run build` first.');
  process.exit(1);
}

// One date for the whole file. Per-URL dates would need a real record of when
// each figure last changed, and inventing one tells search engines something
// we have not actually checked.
const today = new Date().toISOString().slice(0, 10);

const urls = routes()
  .map((route) => {
    const loc = `${SITE_ORIGIN}${route}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const target = join(buildDir, 'sitemap.xml');
writeFileSync(target, xml, 'utf8');
console.log(`Wrote ${target} with ${routes().length} URLs.`);
