#!/usr/bin/env node
/**
 * Check that every cited source still resolves.
 *
 * "Every figure traces back to an original public document" is the site's whole
 * claim, and until this existed nothing verified that the documents were still
 * where the citations said. A reader who clicks a source and gets a 404 has
 * been given a reason to disbelieve the number, which is the opposite of what
 * a citation is for.
 *
 *   node scripts/check-links.mjs
 *   node scripts/check-links.mjs --json
 *
 * Three outcomes, and keeping them apart is the point:
 *
 *   - **Gone.** A 404 or a connection that fails. The citation is wrong and
 *     someone has to find where the document went.
 *   - **Moved.** A redirect. The link still works, but the citation names an
 *     address the publisher has abandoned, and the day the redirect is retired
 *     it becomes the first case. Alberta Find a Doctor became Alberta Find a
 *     Provider exactly this way.
 *   - **Blocked.** A 403 or 429. Statistics agencies and publishers routinely
 *     refuse anything that is not a browser — the OECD does, MNP does. Nothing
 *     is wrong with the link and reporting it as broken would train people to
 *     ignore this check, which is worse than not having it.
 *
 * Only "gone" exits non-zero.
 */

import { register } from 'node:module';

register('./lib/app-modules.mjs', import.meta.url);
const { datasets } = await import('../src/data/index.js');

// Publishers block obvious robots. Asking as a browser is not a trick — a
// reader following this citation is a browser, and that is the thing being
// checked.
const AGENT = 'Mozilla/5.0 (compatible; alberta.wiki link check; +https://alberta.wiki)';
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  + ' (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const TIMEOUT = 20_000;

const asJSON = process.argv.includes('--json');

/** Fetch a URL as a browser would, following redirects, and report where it landed. */
async function visit(url) {
  const attempt = async (agent) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      // GET rather than HEAD: enough publishers answer HEAD with 405 that a
      // HEAD-based check reports healthy links as broken.
      const response = await fetch(url, {
        headers: { 'User-Agent': agent, Accept: '*/*' },
        redirect: 'follow',
        signal: controller.signal,
      });
      return { status: response.status, landed: response.url };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let result = await attempt(AGENT);
    // Try once more as a plain browser before believing a refusal.
    if (result.status === 403 || result.status === 429) result = await attempt(BROWSER);
    return result;
  } catch (error) {
    return { status: 0, landed: url, error: error.name === 'AbortError' ? 'timed out' : error.message };
  }
}

/** Compare two URLs ignoring a trailing slash and the query, which servers add freely. */
function sameTarget(a, b) {
  const strip = (url) => url.replace(/\?.*$/, '').replace(/\/$/, '');
  return strip(a) === strip(b);
}

const seen = new Map();
const gone = [];
const moved = [];
const blocked = [];

for (const { meta } of datasets) {
  for (const source of meta.sources ?? []) {
    if (seen.has(source.url)) {
      seen.get(source.url).push(meta.id);
      continue;
    }
    seen.set(source.url, [meta.id]);

    const { status, landed, error } = await visit(source.url);
    const where = seen.get(source.url);

    if (status === 403 || status === 429) {
      blocked.push({ url: source.url, status, figures: where });
    } else if (status === 0 || status >= 400) {
      gone.push({ url: source.url, status, error: error ?? null, figures: where });
    } else if (!sameTarget(landed, source.url)) {
      moved.push({ url: source.url, landed, figures: where });
    }
  }
}

if (asJSON) {
  console.log(JSON.stringify({ checked: seen.size, gone, moved, blocked }, null, 2));
} else {
  console.log(`\nChecked ${seen.size} cited sources.\n`);

  if (gone.length === 0 && moved.length === 0) {
    console.log('  Every citation resolves to where it says it does.');
  }

  for (const g of gone) {
    console.log(`  GONE    ${g.status || g.error}  ${g.url}`);
    console.log(`          cited by: ${g.figures.join(', ')}`);
  }
  for (const m of moved) {
    console.log(`  MOVED   ${m.url}`);
    console.log(`          now at:   ${m.landed}`);
    console.log(`          cited by: ${m.figures.join(', ')}`);
  }
  if (blocked.length > 0) {
    console.log(`\n  ${blocked.length} publisher(s) refused an automated request. Not a finding:`);
    for (const b of blocked) console.log(`    ${b.status}  ${b.url}`);
  }
  console.log('');
}

// A moved link still works, so it does not fail the run — but it is a citation
// naming an address its publisher has walked away from, and it should be
// updated before the redirect is retired.
process.exit(gone.length > 0 ? 1 : 0);
