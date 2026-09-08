import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from './usePageMeta';

/**
 * The site described itself five different ways at once.
 *
 * `public/index.html` said "data-driven analysis of Alberta today", which this
 * site does not do and says so in its own principles; the title set from
 * JavaScript said something else again; the front page said a third thing. The
 * static file is the one that matters most, because a crawler that does not run
 * JavaScript never sees anything else, so it is the one that had been wrong for
 * longest without anyone noticing.
 */

const html = readFileSync(join(__dirname, '..', '..', 'public', 'index.html'), 'utf8');
const tagContent = (pattern) => (html.match(pattern) || [])[1]?.trim();

describe('the title and description in public/index.html', () => {
  it('match the ones the app sets, so a crawler and a reader see the same thing', () => {
    expect(tagContent(/<title>([^<]*)<\/title>/)).toBe(DEFAULT_TITLE);
    expect(tagContent(/name="description"\s*\n?\s*content="([^"]*)"/)).toBe(DEFAULT_DESCRIPTION);
  });
});

describe('the default title', () => {
  it('leads with the site name', () => {
    expect(DEFAULT_TITLE.startsWith(SITE)).toBe(true);
  });

  it('is short enough that a search result does not cut off the tagline', () => {
    // Google shows roughly 60 characters before truncating.
    expect(DEFAULT_TITLE.length).toBeLessThanOrEqual(60);
  });

  it('does not claim the site analyses anything', () => {
    // The site reports measurements and refuses to draw conclusions from them.
    // "Analysis" and "insights" describe a different product.
    const claims = /analysis|analytics|insight|expert|opinion/i;
    expect(DEFAULT_TITLE).not.toMatch(claims);
    expect(DEFAULT_DESCRIPTION).not.toMatch(claims);
  });
});

describe('the default description', () => {
  it('fits in a search snippet', () => {
    expect(DEFAULT_DESCRIPTION.length).toBeGreaterThan(70);
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it('says why the numbers can be checked, which the title has no room for', () => {
    expect(DEFAULT_DESCRIPTION).toMatch(/original public document/);
  });
});
